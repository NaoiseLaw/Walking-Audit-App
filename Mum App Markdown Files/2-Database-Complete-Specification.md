# Walking Audit Web Application
# Technical Product Requirements Document
# Part 2: Database Complete Specification

**Version:** 1.0  
**Last Updated:** January 2025  
**Document Owner:** Database Architecture Team  
**Status:** Development Ready

---

## Document Overview

This is **Part 2 of 6** in the complete Walking Audit App technical documentation:

1. Main PRD & Architecture
2. **Database Complete Specification** ← You are here
3. API Complete Specification
4. Frontend Complete Implementation
5. Backend Services Implementation
6. Testing & DevOps

---

## Table of Contents

1. [Database Overview](#1-database-overview)
2. [Core Tables](#2-core-tables)
3. [Supporting Tables](#3-supporting-tables)
4. [System Tables](#4-system-tables)
5. [Triggers & Functions](#5-triggers--functions)
6. [Views & Materialized Views](#6-views--materialized-views)
7. [Indexes & Performance](#7-indexes--performance)
8. [Migrations Strategy](#8-migrations-strategy)
9. [Backup & Recovery](#9-backup--recovery)
10. [Security & Access Control](#10-security--access-control)

---

## 1. Database Overview

### 1.1 Database Configuration

```yaml
database_system: PostgreSQL 16
extensions:
  - postgis: 3.4 (spatial data)
  - uuid-ossp: 1.1 (UUID generation)
  - pg_trgm: 1.6 (fuzzy text search)
  - pg_stat_statements: 1.10 (query performance)
  
connection_pool:
  min: 2
  max: 20
  idle_timeout: 10000 # ms
  
encoding: UTF8
timezone: UTC
locale: en_IE.UTF-8
```

### 1.2 Database Design Principles

#### Principle 1: Spatial-First Design
All location data uses PostGIS geometry types (SRID 4326 - WGS84)

#### Principle 2: Soft Deletes
All user-facing tables have `deleted_at` column for GDPR compliance

#### Principle 3: Timestamps Everywhere
Every table has `created_at` and `updated_at` for auditing

#### Principle 4: Type Safety
Use ENUMs and CHECK constraints to enforce data integrity

#### Principle 5: Denormalization for Performance
Strategic denormalization (e.g., audit counts on routes) with triggers to maintain consistency

### 1.3 Entity Relationship Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│    users    │────┬────│   routes    │────┬────│   audits    │
└─────────────┘    │    └─────────────┘    │    └─────────────┘
                   │                       │            │
                   │    ┌─────────────┐    │            │
                   └────│   created   │────┘            │
                        │     by      │                 │
                        └─────────────┘                 │
                                                        │
         ┌──────────────────────────────────────────────┼─────────────┐
         │                                              │             │
         │                                              │             │
┌─────────────────┐                            ┌───────────────┐     │
│audit_participants│                           │audit_sections │     │
└─────────────────┘                            └───────────────┘     │
         │                                                            │
         │                                                            │
┌─────────────────────┐                                              │
│participant_abilities│                                              │
└─────────────────────┘                                              │
                                                                     │
         ┌───────────────────────────────────────────────────────────┤
         │                                                           │
         │                                                           │
┌─────────────┐                                              ┌──────────────┐
│   issues    │────┐                                         │recommendations│
└─────────────┘    │                                         └──────────────┘
         │         │
         │    ┌────────┐
         └────│ photos │
              └────────┘
```

### 1.4 Table Summary

| Table | Purpose | Estimated Rows (Year 1) | Growth Rate |
|-------|---------|-------------------------|-------------|
| users | User accounts | 500 | Slow (monthly) |
| routes | Walking routes | 200 | Slow (monthly) |
| audits | Completed audits | 10,000 | Steady (daily) |
| audit_participants | Who participated | 20,000 | Steady (daily) |
| participant_abilities | User abilities | 40,000 | Steady (daily) |
| audit_sections | Audit responses | 70,000 | Steady (daily) |
| issues | Identified issues | 120,000 | Steady (daily) |
| photos | Uploaded photos | 80,000 | Fast (hourly) |
| recommendations | Improvement suggestions | 30,000 | Steady (daily) |
| baseline_data | External data | 500 | Slow (monthly) |
| report_metrics | Report analytics | 10,000 | Steady (daily) |
| audit_log | Activity log | 200,000 | Fast (hourly) |
| sync_queue | Offline sync queue | 1,000 | Fast (minute) |
| email_queue | Email queue | 5,000 | Steady (daily) |

---

## 2. Core Tables

### 2.1 USERS Table

```sql
-- ============================================
-- USERS: User accounts and authentication
-- ============================================

-- Create ENUM types first
CREATE TYPE user_role AS ENUM (
    'auditor',      -- Regular community member
    'coordinator',  -- Organizes audits
    'la_admin',     -- Local authority officer
    'system_admin'  -- Technical administrator
);

-- Users table
CREATE TABLE users (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Authentication
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    verification_expires TIMESTAMP,
    
    -- Password Reset
    reset_token VARCHAR(255),
    reset_expires TIMESTAMP,
    
    -- Profile
    name VARCHAR(255) NOT NULL,
    profile_photo_url TEXT,
    bio TEXT,
    phone VARCHAR(50),
    
    -- Role & Organization
    role user_role DEFAULT 'auditor',
    organization VARCHAR(255),
    county VARCHAR(100),
    
    -- Preferences
    language VARCHAR(5) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'Europe/Dublin',
    notification_preferences JSONB DEFAULT '{"email": true, "push": false}',
    
    -- Statistics (denormalized for performance)
    audit_count INTEGER DEFAULT 0,
    last_audit_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    
    -- Soft delete (GDPR)
    deleted_at TIMESTAMP NULL,
    deleted_reason TEXT,
    
    -- Constraints
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT password_not_empty CHECK (password_hash <> ''),
    CONSTRAINT name_not_empty CHECK (trim(name) <> '')
);

-- Indexes
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_organization ON users(organization) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_county ON users(county) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created ON users(created_at DESC);
CREATE INDEX idx_users_deleted ON users(deleted_at) WHERE deleted_at IS NOT NULL;

-- Full text search index for user search
CREATE INDEX idx_users_search ON users USING GIN(to_tsvector('english', 
    coalesce(name, '') || ' ' || 
    coalesce(email, '') || ' ' || 
    coalesce(organization, '')
));

-- Comments
COMMENT ON TABLE users IS 'User accounts for the walking audit application';
COMMENT ON COLUMN users.role IS 'User role: auditor (default), coordinator, la_admin, system_admin';
COMMENT ON COLUMN users.notification_preferences IS 'JSON object with notification settings';
COMMENT ON COLUMN users.deleted_at IS 'Soft delete timestamp for GDPR compliance';
```

### 2.2 ROUTES Table

```sql
-- ============================================
-- ROUTES: Walking routes/paths to audit
-- ============================================

CREATE TABLE routes (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Location
    town_city VARCHAR(255) NOT NULL,
    county VARCHAR(100) NOT NULL,
    eircode VARCHAR(10), -- Irish postcode
    
    -- Geometry (PostGIS - WGS84 coordinates)
    geometry GEOMETRY(LineString, 4326) NOT NULL,
    
    -- Calculated Fields (auto-populated by triggers)
    distance_meters DECIMAL(10,2),
    bbox GEOMETRY(Polygon, 4326), -- Bounding box
    center_point GEOMETRY(Point, 4326), -- Center of route
    
    -- Enhanced Data (from research recommendations)
    avg_gradient_percent DECIMAL(4,2),
    max_gradient_percent DECIMAL(4,2),
    min_elevation_meters DECIMAL(7,2),
    max_elevation_meters DECIMAL(7,2),
    
    permeability_score INTEGER CHECK (permeability_score BETWEEN 1 AND 5),
    permeability_notes TEXT,
    
    has_public_transport BOOLEAN DEFAULT FALSE,
    nearest_bus_stop_meters INTEGER,
    nearest_rail_station_meters INTEGER,
    
    -- Route Context
    route_type VARCHAR(50) CHECK (route_type IN (
        'urban',
        'suburban',
        'rural',
        'coastal',
        'mixed'
    )),
    
    surface_type VARCHAR(50) CHECK (surface_type IN (
        'paved',
        'unpaved',
        'mixed',
        'gravel',
        'grass'
    )),
    
    lighting VARCHAR(50) CHECK (lighting IN (
        'full',
        'partial',
        'none',
        'unknown'
    )),
    
    -- Tags for filtering
    tags TEXT[],
    
    -- Metadata
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Audit Statistics (denormalized for performance)
    audit_count INTEGER DEFAULT 0,
    avg_score DECIMAL(4,2),
    last_audited TIMESTAMP,
    
    -- Visibility
    is_public BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Soft delete
    deleted_at TIMESTAMP NULL,
    
    -- Constraints
    CONSTRAINT name_not_empty CHECK (trim(name) <> ''),
    CONSTRAINT valid_distance CHECK (distance_meters IS NULL OR distance_meters > 0),
    CONSTRAINT valid_gradient CHECK (
        (avg_gradient_percent IS NULL OR avg_gradient_percent BETWEEN -30 AND 30) AND
        (max_gradient_percent IS NULL OR max_gradient_percent BETWEEN -30 AND 30)
    )
);

-- Spatial indexes (critical for performance!)
CREATE INDEX idx_routes_geometry ON routes USING GIST(geometry);
CREATE INDEX idx_routes_bbox ON routes USING GIST(bbox);
CREATE INDEX idx_routes_center ON routes USING GIST(center_point);

-- Regular indexes
CREATE INDEX idx_routes_county ON routes(county) WHERE deleted_at IS NULL;
CREATE INDEX idx_routes_town ON routes(town_city) WHERE deleted_at IS NULL;
CREATE INDEX idx_routes_created_by ON routes(created_by);
CREATE INDEX idx_routes_created ON routes(created_at DESC);
CREATE INDEX idx_routes_audited ON routes(last_audited DESC) WHERE last_audited IS NOT NULL;
CREATE INDEX idx_routes_public ON routes(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_routes_featured ON routes(is_featured) WHERE is_featured = TRUE;

-- Full text search
CREATE INDEX idx_routes_search ON routes USING GIN(to_tsvector('english', 
    coalesce(name, '') || ' ' || 
    coalesce(description, '') || ' ' || 
    coalesce(town_city, '') || ' ' ||
    coalesce(county, '')
));

-- GIN index for tags array
CREATE INDEX idx_routes_tags ON routes USING GIN(tags);

-- Comments
COMMENT ON TABLE routes IS 'Walking routes that can be audited';
COMMENT ON COLUMN routes.geometry IS 'LineString representing the walking route (WGS84)';
COMMENT ON COLUMN routes.bbox IS 'Bounding box for spatial queries';
COMMENT ON COLUMN routes.permeability_score IS 'How easily can you access other areas (1=poor, 5=excellent)';
COMMENT ON COLUMN routes.tags IS 'Array of tags for filtering (e.g., school route, accessible, scenic)';
```

### 2.3 AUDITS Table

```sql
-- ============================================
-- AUDITS: Completed walking audits
-- ============================================

CREATE TYPE audit_status AS ENUM (
    'draft',        -- In progress, not submitted
    'in_progress',  -- Being filled out
    'completed',    -- Submitted and complete
    'reviewed',     -- Reviewed by LA
    'archived'      -- Archived (old)
);

CREATE TABLE audits (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE RESTRICT,
    coordinator_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Basic Details
    audit_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    duration_minutes INTEGER,
    weather VARCHAR(100),
    temperature_celsius INTEGER,
    
    -- Context
    is_school_route BOOLEAN DEFAULT FALSE,
    school_name VARCHAR(255),
    peak_time BOOLEAN DEFAULT FALSE, -- During rush hour?
    
    -- Status
    status audit_status DEFAULT 'draft',
    
    -- Scores (auto-calculated from audit_sections)
    footpaths_score INTEGER CHECK (footpaths_score BETWEEN 1 AND 5),
    facilities_score INTEGER CHECK (facilities_score BETWEEN 1 AND 5),
    crossings_score INTEGER CHECK (crossings_score BETWEEN 1 AND 5),
    behaviour_score INTEGER CHECK (behaviour_score BETWEEN 1 AND 5),
    safety_score INTEGER CHECK (safety_score BETWEEN 1 AND 5),
    look_feel_score INTEGER CHECK (look_feel_score BETWEEN 1 AND 5),
    school_gates_score INTEGER CHECK (school_gates_score BETWEEN 1 AND 5),
    
    total_score INTEGER,
    max_possible_score INTEGER,
    normalized_score DECIMAL(3,2), -- 0.00 to 5.00
    
    -- Walkability rating (calculated)
    walkability_rating VARCHAR(20) CHECK (walkability_rating IN (
        'Very Poor',
        'Poor',
        'Fair',
        'OK',
        'Good',
        'Excellent'
    )),
    
    -- Overall Feedback
    enjoyability_rating INTEGER CHECK (enjoyability_rating BETWEEN 1 AND 5),
    would_walk_more BOOLEAN,
    would_recommend BOOLEAN,
    liked_most TEXT,
    disliked_most TEXT,
    additional_comments TEXT,
    
    -- Report
    report_pdf_url TEXT,
    report_generated_at TIMESTAMP,
    report_version INTEGER DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by UUID REFERENCES users(id),
    
    -- Version (for conflict resolution in offline sync)
    version INTEGER DEFAULT 1,
    
    -- Soft delete
    deleted_at TIMESTAMP NULL,
    
    -- Constraints
    CONSTRAINT valid_times CHECK (
        (start_time IS NULL AND end_time IS NULL) OR
        (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
    ),
    CONSTRAINT valid_duration CHECK (
        duration_minutes IS NULL OR duration_minutes > 0
    ),
    CONSTRAINT valid_completion CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR
        (status != 'completed')
    ),
    CONSTRAINT school_gates_score_valid CHECK (
        (is_school_route = FALSE AND school_gates_score IS NULL) OR
        (is_school_route = TRUE)
    )
);

-- Indexes
CREATE INDEX idx_audits_route ON audits(route_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_audits_coordinator ON audits(coordinator_id);
CREATE INDEX idx_audits_status ON audits(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_audits_date ON audits(audit_date DESC);
CREATE INDEX idx_audits_completed ON audits(completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_audits_created ON audits(created_at DESC);
CREATE INDEX idx_audits_rating ON audits(walkability_rating) WHERE walkability_rating IS NOT NULL;
CREATE INDEX idx_audits_school ON audits(is_school_route) WHERE is_school_route = TRUE;

-- Composite indexes for common queries
CREATE INDEX idx_audits_route_date ON audits(route_id, audit_date DESC);
CREATE INDEX idx_audits_status_date ON audits(status, created_at DESC);

-- Comments
COMMENT ON TABLE audits IS 'Completed walking audits of routes';
COMMENT ON COLUMN audits.normalized_score IS 'Total score normalized to 0-5 scale for comparison';
COMMENT ON COLUMN audits.version IS 'Version number for optimistic locking in offline sync';
```

### 2.4 AUDIT_PARTICIPANTS Table

```sql
-- ============================================
-- AUDIT_PARTICIPANTS: Who participated in audit
-- ============================================

CREATE TYPE ability_type AS ENUM (
    'wheelchair_user',
    'reduced_mobility',
    'blind_low_vision',
    'deaf_hearing_loss',
    'cognitive_difficulties',
    'buggy_stroller',
    'young_child',
    'carer',
    'none'
);

CREATE TABLE audit_participants (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL if anonymous
    
    -- Demographics (NTA methodology)
    age_group VARCHAR(10) NOT NULL CHECK (age_group IN (
        '0-4',
        '5-12',
        '13-18',
        '19-25',
        '26-64',
        '65-79',
        '80+'
    )),
    
    sex VARCHAR(20) CHECK (sex IN (
        'female',
        'male',
        'other',
        'prefer_not_say'
    )),
    
    -- Participation
    participated_at TIMESTAMP DEFAULT NOW(),
    
    -- Unique constraint: same user can't be added twice to same audit
    CONSTRAINT unique_participant_per_audit UNIQUE (audit_id, user_id)
);

-- Junction table for abilities (many-to-many)
CREATE TABLE participant_abilities (
    participant_id UUID NOT NULL REFERENCES audit_participants(id) ON DELETE CASCADE,
    ability ability_type NOT NULL,
    
    PRIMARY KEY (participant_id, ability)
);

-- Indexes
CREATE INDEX idx_participants_audit ON audit_participants(audit_id);
CREATE INDEX idx_participants_user ON audit_participants(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_participants_age ON audit_participants(age_group);
CREATE INDEX idx_abilities_participant ON participant_abilities(participant_id);
CREATE INDEX idx_abilities_type ON participant_abilities(ability);

-- Comments
COMMENT ON TABLE audit_participants IS 'People who participated in walking audits';
COMMENT ON COLUMN audit_participants.user_id IS 'Null if anonymous participant';
COMMENT ON TABLE participant_abilities IS 'Junction table: participant can have multiple abilities/needs';
```

### 2.5 AUDIT_SECTIONS Table

```sql
-- ============================================
-- AUDIT_SECTIONS: Responses to audit questions
-- ============================================

CREATE TYPE section_name AS ENUM (
    'footpaths',
    'facilities',
    'crossing_road',
    'road_user_behaviour',
    'safety',
    'look_and_feel',
    'school_gates'
);

CREATE TABLE audit_sections (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    
    -- Section
    section section_name NOT NULL,
    
    -- Score (1-5: Poor, Fair, OK, Good, Excellent)
    score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
    
    -- Responses (JSONB for flexibility)
    -- Structure varies by section but generally:
    -- {
    --   "main_problems": ["issue1", "issue2"],
    --   "specific_issues": {...},
    --   "other_details": {...}
    -- }
    responses JSONB NOT NULL DEFAULT '{}',
    
    -- Free Text
    comments TEXT,
    problem_areas TEXT[], -- Array of location descriptions
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraint: One section per audit
    UNIQUE(audit_id, section)
);

-- Indexes
CREATE INDEX idx_sections_audit ON audit_sections(audit_id);
CREATE INDEX idx_sections_section ON audit_sections(section);
CREATE INDEX idx_sections_score ON audit_sections(score);

-- GIN index for JSONB querying
CREATE INDEX idx_sections_responses ON audit_sections USING GIN(responses);

-- Full text search on comments
CREATE INDEX idx_sections_comments_search ON audit_sections USING GIN(to_tsvector('english', coalesce(comments, '')));

-- Comments
COMMENT ON TABLE audit_sections IS 'Individual section responses within an audit';
COMMENT ON COLUMN audit_sections.responses IS 'JSONB containing checkbox/radio responses specific to each section';
COMMENT ON COLUMN audit_sections.problem_areas IS 'Array of specific location descriptions where problems occur';

-- Example JSONB structures for each section:

-- Footpaths section example:
-- {
--   "main_problems": ["not_wide_enough", "need_to_step_off"],
--   "surface_condition": ["cracks", "poor_repair", "tree_damage"],
--   "obstacles": ["overgrown_hedges", "bollards", "parked_vehicles"]
-- }

-- Facilities section example:
-- {
--   "access_issues": ["no_dropped_kerbs", "tactile_paving_missing"],
--   "seating_issues": ["no_seating", "not_enough_rest_areas"],
--   "bin_issues": ["bins_too_high", "no_bins"],
--   "toilet_issues": ["no_toilets"],
--   "parking_issues": ["not_enough_cycle_parking", "no_motorcycle_parking"]
-- }
```

### 2.6 ISSUES Table

```sql
-- ============================================
-- ISSUES: Specific problems identified during audit
-- ============================================

CREATE TYPE issue_category AS ENUM (
    'footpath',
    'crossing',
    'obstacle',
    'safety',
    'lighting',
    'signage',
    'facility',
    'traffic',
    'accessibility',
    'maintenance',
    'other'
);

CREATE TYPE issue_severity AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

CREATE TABLE issues (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    section section_name NOT NULL,
    
    -- Location (PostGIS Point - WGS84)
    location GEOMETRY(Point, 4326) NOT NULL,
    location_description TEXT,
    location_accuracy_meters INTEGER, -- GPS accuracy
    
    -- Classification
    category issue_category NOT NULL,
    severity issue_severity DEFAULT 'medium',
    
    -- Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Who Reported
    reported_by UUID REFERENCES audit_participants(id) ON DELETE SET NULL,
    
    -- LA Response
    la_acknowledged BOOLEAN DEFAULT FALSE,
    la_acknowledged_at TIMESTAMP,
    la_acknowledged_by UUID REFERENCES users(id),
    la_response TEXT,
    la_status VARCHAR(50) DEFAULT 'open' CHECK (la_status IN (
        'open',
        'in_progress',
        'resolved',
        'wont_fix',
        'duplicate',
        'needs_info'
    )),
    
    -- Resolution
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    resolved_by UUID REFERENCES users(id),
    
    -- Verification
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    verified_by UUID REFERENCES users(id),
    
    -- Cost Estimate (if LA provides)
    estimated_cost_euros DECIMAL(10,2),
    actual_cost_euros DECIMAL(10,2),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Soft delete
    deleted_at TIMESTAMP NULL,
    
    -- Constraints
    CONSTRAINT title_not_empty CHECK (trim(title) <> ''),
    CONSTRAINT valid_costs CHECK (
        (estimated_cost_euros IS NULL OR estimated_cost_euros >= 0) AND
        (actual_cost_euros IS NULL OR actual_cost_euros >= 0)
    )
);

-- Spatial indexes
CREATE INDEX idx_issues_location ON issues USING GIST(location) WHERE deleted_at IS NULL;

-- Regular indexes
CREATE INDEX idx_issues_audit ON issues(audit_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_issues_section ON issues(section);
CREATE INDEX idx_issues_category ON issues(category);
CREATE INDEX idx_issues_severity ON issues(severity);
CREATE INDEX idx_issues_status ON issues(la_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_issues_created ON issues(created_at DESC);
CREATE INDEX idx_issues_resolved ON issues(resolved_at) WHERE resolved_at IS NOT NULL;

-- Composite indexes
CREATE INDEX idx_issues_severity_status ON issues(severity, la_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_issues_audit_severity ON issues(audit_id, severity);

-- Full text search
CREATE INDEX idx_issues_search ON issues USING GIN(to_tsvector('english', 
    coalesce(title, '') || ' ' || 
    coalesce(description, '') || ' ' ||
    coalesce(location_description, '')
));

-- Comments
COMMENT ON TABLE issues IS 'Specific problems/issues identified during audits';
COMMENT ON COLUMN issues.location IS 'GPS point where issue was observed (WGS84)';
COMMENT ON COLUMN issues.location_accuracy_meters IS 'GPS accuracy in meters (lower is better)';
COMMENT ON COLUMN issues.la_status IS 'Local authority response status';
```

### 2.7 PHOTOS Table

```sql
-- ============================================
-- PHOTOS: Photos uploaded during audits
-- ============================================

CREATE TABLE photos (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    
    -- Storage URLs
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    
    -- Metadata
    filename VARCHAR(255),
    original_filename VARCHAR(255),
    file_size_kb INTEGER,
    mime_type VARCHAR(50),
    width_px INTEGER,
    height_px INTEGER,
    
    -- Location (extracted from EXIF or manually set)
    location GEOMETRY(Point, 4326),
    location_accuracy_meters INTEGER,
    location_source VARCHAR(20) CHECK (location_source IN (
        'exif',
        'manual',
        'device_gps'
    )),
    
    -- EXIF Data (preserved as JSONB)
    taken_at TIMESTAMP,
    camera_make VARCHAR(100),
    camera_model VARCHAR(100),
    focal_length_mm DECIMAL(5,2),
    aperture VARCHAR(10),
    iso INTEGER,
    exif_data JSONB,
    
    -- Processing
    processed BOOLEAN DEFAULT FALSE,
    compression_applied BOOLEAN DEFAULT FALSE,
    blur_faces BOOLEAN DEFAULT FALSE, -- GDPR privacy
    
    -- Who Uploaded
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    
    -- Soft delete
    deleted_at TIMESTAMP NULL,
    
    -- Constraints
    CONSTRAINT valid_size CHECK (file_size_kb > 0),
    CONSTRAINT valid_dimensions CHECK (
        (width_px IS NULL AND height_px IS NULL) OR
        (width_px > 0 AND height_px > 0)
    )
);

-- Indexes
CREATE INDEX idx_photos_issue ON photos(issue_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_photos_audit ON photos(audit_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_photos_uploaded ON photos(uploaded_at DESC);
CREATE INDEX idx_photos_uploaded_by ON photos(uploaded_by) WHERE uploaded_by IS NOT NULL;
CREATE INDEX idx_photos_taken ON photos(taken_at) WHERE taken_at IS NOT NULL;

-- Spatial index
CREATE INDEX idx_photos_location ON photos USING GIST(location) 
WHERE location IS NOT NULL AND deleted_at IS NULL;

-- GIN index for EXIF data queries
CREATE INDEX idx_photos_exif ON photos USING GIN(exif_data);

-- Comments
COMMENT ON TABLE photos IS 'Photos uploaded during audits';
COMMENT ON COLUMN photos.blur_faces IS 'Whether faces should be blurred for GDPR compliance';
COMMENT ON COLUMN photos.exif_data IS 'Complete EXIF data as JSON for future reference';
```

### 2.8 RECOMMENDATIONS Table

```sql
-- ============================================
-- RECOMMENDATIONS: Suggested improvements
-- ============================================

CREATE TABLE recommendations (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    
    -- Priority (1 = highest)
    priority INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 10),
    
    -- Details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    rationale TEXT, -- Why this is important
    
    -- Linked Issues
    related_issue_ids UUID[] DEFAULT '{}',
    issue_count INTEGER DEFAULT 0,
    
    -- Implementation Details
    estimated_cost_euros DECIMAL(10,2),
    estimated_timeframe VARCHAR(100),
    complexity VARCHAR(20) CHECK (complexity IN (
        'simple',
        'moderate',
        'complex',
        'major_project'
    )),
    
    -- Categorization
    category VARCHAR(50) CHECK (category IN (
        'infrastructure',
        'maintenance',
        'policy',
        'signage',
        'traffic_management',
        'accessibility',
        'lighting',
        'other'
    )),
    
    -- LA Response
    la_status VARCHAR(50) DEFAULT 'pending' CHECK (la_status IN (
        'pending',
        'reviewed',
        'approved',
        'rejected',
        'in_progress',
        'completed',
        'on_hold'
    )),
    la_response TEXT,
    la_response_date TIMESTAMP,
    la_responded_by UUID REFERENCES users(id),
    
    rejection_reason TEXT,
    
    -- Completion
    implemented BOOLEAN DEFAULT FALSE,
    implemented_at TIMESTAMP,
    implementation_notes TEXT,
    implementation_cost_euros DECIMAL(10,2),
    implemented_by UUID REFERENCES users(id),
    
    -- Verification
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    verified_by UUID REFERENCES users(id),
    verification_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Soft delete
    deleted_at TIMESTAMP NULL,
    
    -- Constraints
    CONSTRAINT title_not_empty CHECK (trim(title) <> ''),
    CONSTRAINT description_not_empty CHECK (trim(description) <> ''),
    CONSTRAINT valid_costs CHECK (
        (estimated_cost_euros IS NULL OR estimated_cost_euros >= 0) AND
        (implementation_cost_euros IS NULL OR implementation_cost_euros >= 0)
    )
);

-- Indexes
CREATE INDEX idx_recommendations_audit ON recommendations(audit_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_recommendations_status ON recommendations(la_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_recommendations_priority ON recommendations(priority);
CREATE INDEX idx_recommendations_category ON recommendations(category);
CREATE INDEX idx_recommendations_implemented ON recommendations(implemented) WHERE implemented = TRUE;
CREATE INDEX idx_recommendations_created ON recommendations(created_at DESC);

-- Composite indexes
CREATE INDEX idx_recommendations_audit_priority ON recommendations(audit_id, priority);
CREATE INDEX idx_recommendations_status_date ON recommendations(la_status, created_at DESC);

-- GIN index for array operations
CREATE INDEX idx_recommendations_issues ON recommendations USING GIN(related_issue_ids);

-- Full text search
CREATE INDEX idx_recommendations_search ON recommendations USING GIN(to_tsvector('english', 
    coalesce(title, '') || ' ' || 
    coalesce(description, '') || ' ' ||
    coalesce(rationale, '')
));

-- Comments
COMMENT ON TABLE recommendations IS 'Suggested improvements from audits';
COMMENT ON COLUMN recommendations.priority IS '1 = highest priority, 10 = lowest';
COMMENT ON COLUMN recommendations.related_issue_ids IS 'Array of issue UUIDs that this recommendation addresses';
```

---

## 3. Supporting Tables

### 3.1 BASELINE_DATA Table

```sql
-- ============================================
-- BASELINE_DATA: External data for context
-- ============================================

CREATE TABLE baseline_data (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    audit_id UUID REFERENCES audits(id) ON DELETE CASCADE,
    
    -- Point location for granular data
    location GEOMETRY(Point, 4326),
    
    -- Traffic Data (from TII/NTA APIs)
    avg_traffic_volume INTEGER,
    peak_traffic_volume INTEGER,
    off_peak_traffic_volume INTEGER,
    avg_traffic_speed_kmh DECIMAL(5,2),
    traffic_data_date DATE,
    
    -- Environmental Data (from EPA Ireland)
    air_quality_index INTEGER CHECK (air_quality_index BETWEEN 1 AND 10),
    pm25_concentration DECIMAL(6,2), -- μg/m³
    pm10_concentration DECIMAL(6,2),
    no2_concentration DECIMAL(6,2),
    o3_concentration DECIMAL(6,2),
    air_quality_date DATE,
    
    noise_level_db DECIMAL(5,2),
    noise_source VARCHAR(100),
    noise_measurement_date DATE,
    
    -- Infrastructure Density (calculated from OSM/GIS)
    intersection_density DECIMAL(10,4), -- per km²
    residential_density INTEGER, -- units per km²
    commercial_density INTEGER, -- businesses per km²
    land_use_mix DECIMAL(3,2), -- 0-1 entropy score
    
    -- Public Transport (from NTA/Transport for Ireland)
    bus_stops_within_400m INTEGER,
    bus_routes_count INTEGER,
    rail_stations_within_800m INTEGER,
    bike_share_stations_within_500m INTEGER,
    
    -- Walkability Metrics
    pedestrian_flow_count INTEGER, -- pedestrians per hour
    pedestrian_flow_peak_time TIME,
    
    -- Data Source & Version
    data_source VARCHAR(100) NOT NULL,
    data_version VARCHAR(50),
    data_date DATE NOT NULL,
    collected_at TIMESTAMP DEFAULT NOW(),
    
    -- Metadata
    collection_method VARCHAR(100),
    accuracy_level VARCHAR(50) CHECK (accuracy_level IN (
        'high',
        'medium',
        'low',
        'estimated'
    )),
    notes TEXT,
    
    -- Version (for updates)
    version INTEGER DEFAULT 1,
    
    -- Constraints
    CONSTRAINT valid_traffic CHECK (
        (avg_traffic_volume IS NULL OR avg_traffic_volume >= 0) AND
        (peak_traffic_volume IS NULL OR peak_traffic_volume >= 0)
    ),
    CONSTRAINT valid_densities CHECK (
        (intersection_density IS NULL OR intersection_density >= 0) AND
        (residential_density IS NULL OR residential_density >= 0)
    )
);

-- Indexes
CREATE INDEX idx_baseline_route ON baseline_data(route_id);
CREATE INDEX idx_baseline_audit ON baseline_data(audit_id) WHERE audit_id IS NOT NULL;
CREATE INDEX idx_baseline_date ON baseline_data(data_date DESC);
CREATE INDEX idx_baseline_source ON baseline_data(data_source);

-- Spatial index
CREATE INDEX idx_baseline_location ON baseline_data USING GIST(location) 
WHERE location IS NOT NULL;

-- Comments
COMMENT ON TABLE baseline_data IS 'External contextual data for routes (traffic, air quality, etc.)';
COMMENT ON COLUMN baseline_data.land_use_mix IS 'Entropy measure of land use diversity (higher = more mixed use)';
```

### 3.2 REPORT_METRICS Table

```sql
-- ============================================
-- REPORT_METRICS: Calculated metrics for reports
-- ============================================

CREATE TABLE report_metrics (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships (one-to-one with audits)
    audit_id UUID UNIQUE NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    
    -- Normalized Scores (for radar chart - all on 0-5 scale)
    footpaths_score DECIMAL(3,2) CHECK (footpaths_score BETWEEN 0 AND 5),
    facilities_score DECIMAL(3,2) CHECK (facilities_score BETWEEN 0 AND 5),
    crossings_score DECIMAL(3,2) CHECK (crossings_score BETWEEN 0 AND 5),
    behaviour_score DECIMAL(3,2) CHECK (behaviour_score BETWEEN 0 AND 5),
    safety_score DECIMAL(3,2) CHECK (safety_score BETWEEN 0 AND 5),
    look_feel_score DECIMAL(3,2) CHECK (look_feel_score BETWEEN 0 AND 5),
    school_gates_score DECIMAL(3,2) CHECK (school_gates_score BETWEEN 0 AND 5),
    
    overall_score DECIMAL(3,2) CHECK (overall_score BETWEEN 0 AND 5),
    
    -- Aggregate Counts
    total_issues INTEGER DEFAULT 0,
    critical_issues INTEGER DEFAULT 0,
    high_issues INTEGER DEFAULT 0,
    medium_issues INTEGER DEFAULT 0,
    low_issues INTEGER DEFAULT 0,
    
    total_photos INTEGER DEFAULT 0,
    total_recommendations INTEGER DEFAULT 0,
    total_participants INTEGER DEFAULT 0,
    
    -- Issue Categories (denormalized for quick access)
    footpath_issues INTEGER DEFAULT 0,
    crossing_issues INTEGER DEFAULT 0,
    safety_issues INTEGER DEFAULT 0,
    lighting_issues INTEGER DEFAULT 0,
    accessibility_issues INTEGER DEFAULT 0,
    
    -- Comparisons (calculated against other audits)
    county_avg_score DECIMAL(4,2),
    national_avg_score DECIMAL(4,2),
    similar_routes_avg_score DECIMAL(4,2),
    
    percentile_rank INTEGER CHECK (percentile_rank BETWEEN 1 AND 100),
    rank_within_county INTEGER,
    total_audits_in_county INTEGER,
    
    -- Hotspots (top 3 problem categories)
    top_issue_category_1 issue_category,
    top_issue_category_1_count INTEGER,
    top_issue_category_2 issue_category,
    top_issue_category_2_count INTEGER,
    top_issue_category_3 issue_category,
    top_issue_category_3_count INTEGER,
    
    -- Strengths (top 3 highest scoring sections)
    top_strength_1 section_name,
    top_strength_1_score DECIMAL(3,2),
    top_strength_2 section_name,
    top_strength_2_score DECIMAL(3,2),
    top_strength_3 section_name,
    top_strength_3_score DECIMAL(3,2),
    
    -- Weaknesses (top 3 lowest scoring sections)
    top_weakness_1 section_name,
    top_weakness_1_score DECIMAL(3,2),
    top_weakness_2 section_name,
    top_weakness_2_score DECIMAL(3,2),
    top_weakness_3 section_name,
    top_weakness_3_score DECIMAL(3,2),
    
    -- Generated
    generated_at TIMESTAMP DEFAULT NOW(),
    
    -- Cache invalidation
    cache_valid_until TIMESTAMP,
    needs_regeneration BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_report_metrics_audit ON report_metrics(audit_id);
CREATE INDEX idx_report_metrics_generated ON report_metrics(generated_at DESC);
CREATE INDEX idx_report_metrics_invalid ON report_metrics(needs_regeneration) 
WHERE needs_regeneration = TRUE;

-- Comments
COMMENT ON TABLE report_metrics IS 'Pre-calculated metrics for fast report generation';
COMMENT ON COLUMN report_metrics.percentile_rank IS 'Percentile compared to all audits (higher = better)';
COMMENT ON COLUMN report_metrics.needs_regeneration IS 'Flag set when source data changes';
```

---

## 4. System Tables

### 4.1 AUDIT_LOG Table

```sql
-- ============================================
-- AUDIT_LOG: Activity log for auditing/compliance
-- ============================================

CREATE TABLE audit_log (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    audit_id UUID REFERENCES audits(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'audit', 'issue', 'photo', 'recommendation', 'user'
    entity_id UUID,
    
    -- Details (as JSONB for flexibility)
    details JSONB DEFAULT '{}',
    
    -- Old/New Values (for updates)
    old_values JSONB,
    new_values JSONB,
    
    -- Request Info
    ip_address INET,
    user_agent TEXT,
    request_method VARCHAR(10),
    request_path TEXT,
    
    -- Outcome
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error_message TEXT,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT action_not_empty CHECK (trim(action) <> ''),
    CONSTRAINT entity_type_not_empty CHECK (trim(entity_type) <> '')
);

-- Partition by month for performance
CREATE TABLE audit_log_template (LIKE audit_log INCLUDING ALL);

-- Create partitions for current and next month
CREATE TABLE audit_log_y2025m01 PARTITION OF audit_log
    FOR VALUES FROM ('2025-01-01 00:00:00') TO ('2025-02-01 00:00:00');

CREATE TABLE audit_log_y2025m02 PARTITION OF audit_log
    FOR VALUES FROM ('2025-02-01 00:00:00') TO ('2025-03-01 00:00:00');

-- Indexes on parent table
CREATE INDEX idx_audit_log_audit ON audit_log(audit_id) WHERE audit_id IS NOT NULL;
CREATE INDEX idx_audit_log_user ON audit_log(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_ip ON audit_log(ip_address) WHERE ip_address IS NOT NULL;

-- GIN indexes for JSONB
CREATE INDEX idx_audit_log_details ON audit_log USING GIN(details);
CREATE INDEX idx_audit_log_old_values ON audit_log USING GIN(old_values);
CREATE INDEX idx_audit_log_new_values ON audit_log USING GIN(new_values);

-- Comments
COMMENT ON TABLE audit_log IS 'Activity log for all actions in the system';
COMMENT ON COLUMN audit_log.details IS 'Additional context about the action';
COMMENT ON COLUMN audit_log.old_values IS 'Previous values (for UPDATE actions)';
COMMENT ON COLUMN audit_log.new_values IS 'New values (for UPDATE actions)';

-- Function to create next month's partition
CREATE OR REPLACE FUNCTION create_next_audit_log_partition()
RETURNS VOID AS $$
DECLARE
    next_month DATE;
    partition_name TEXT;
    start_date TEXT;
    end_date TEXT;
BEGIN
    next_month := date_trunc('month', NOW() + INTERVAL '2 months');
    partition_name := 'audit_log_y' || to_char(next_month, 'YYYY') || 'm' || to_char(next_month, 'MM');
    start_date := to_char(next_month, 'YYYY-MM-DD');
    end_date := to_char(next_month + INTERVAL '1 month', 'YYYY-MM-DD');
    
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_log FOR VALUES FROM (%L) TO (%L)',
        partition_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;

-- Schedule monthly partition creation (call from cron job)
COMMENT ON FUNCTION create_next_audit_log_partition IS 'Creates next month partition for audit_log table';
```

### 4.2 SYNC_QUEUE Table

```sql
-- ============================================
-- SYNC_QUEUE: For tracking offline syncs
-- ============================================

CREATE TABLE sync_queue (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Sync Item
    entity_type VARCHAR(50) NOT NULL, -- 'audit', 'photo', 'issue', 'recommendation'
    entity_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL CHECK (operation IN (
        'create',
        'update',
        'delete'
    )),
    
    -- Payload (complete data for offline-created items)
    payload JSONB NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending',
        'processing',
        'completed',
        'failed',
        'cancelled'
    )),
    
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN (
        'high',
        'normal',
        'low'
    )),
    
    -- Retry Logic
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_error TEXT,
    last_attempt_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Metadata
    device_info JSONB,
    app_version VARCHAR(20),
    
    -- Constraints
    CONSTRAINT valid_attempts CHECK (attempts >= 0 AND attempts <= max_attempts)
);

-- Indexes
CREATE INDEX idx_sync_queue_user ON sync_queue(user_id);
CREATE INDEX idx_sync_queue_status ON sync_queue(status) WHERE status IN ('pending', 'failed');
CREATE INDEX idx_sync_queue_priority ON sync_queue(priority, created_at);
CREATE INDEX idx_sync_queue_entity ON sync_queue(entity_type, entity_id);
CREATE INDEX idx_sync_queue_created ON sync_queue(created_at);

-- Composite index for queue processing
CREATE INDEX idx_sync_queue_processing ON sync_queue(status, priority DESC, created_at) 
WHERE status = 'pending';

-- Comments
COMMENT ON TABLE sync_queue IS 'Queue for syncing offline-created data when connection restored';
COMMENT ON COLUMN sync_queue.payload IS 'Complete data payload from offline client';
COMMENT ON COLUMN sync_queue.priority IS 'High priority items (like completed audits) sync first';
```

### 4.3 EMAIL_QUEUE Table

```sql
-- ============================================
-- EMAIL_QUEUE: Email sending queue
-- ============================================

CREATE TABLE email_queue (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Recipient
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Email Content
    subject VARCHAR(500) NOT NULL,
    body_text TEXT,
    body_html TEXT,
    
    -- Template (optional - use template instead of body)
    template_name VARCHAR(100),
    template_data JSONB,
    
    -- Attachments
    attachments JSONB, -- Array of {filename, url, size_kb}
    
    -- Category (for analytics)
    email_type VARCHAR(50) CHECK (email_type IN (
        'verification',
        'password_reset',
        'audit_completed',
        'issue_response',
        'recommendation_response',
        'report_ready',
        'weekly_digest',
        'notification'
    )),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending',
        'sending',
        'sent',
        'failed',
        'bounced',
        'complained'
    )),
    
    sent_at TIMESTAMP,
    
    -- Error Handling
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_error TEXT,
    last_attempt_at TIMESTAMP,
    
    -- SendGrid Response
    sendgrid_message_id VARCHAR(255),
    sendgrid_response JSONB,
    
    -- Priority
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN (
        'high',
        'normal',
        'low'
    )),
    
    -- Scheduled Send
    send_after TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_attempts CHECK (attempts >= 0 AND attempts <= max_attempts),
    CONSTRAINT subject_not_empty CHECK (trim(subject) <> ''),
    CONSTRAINT has_content CHECK (
        (body_text IS NOT NULL OR body_html IS NOT NULL OR template_name IS NOT NULL)
    )
);

-- Indexes
CREATE INDEX idx_email_queue_status ON email_queue(status) WHERE status IN ('pending', 'failed');
CREATE INDEX idx_email_queue_created ON email_queue(created_at);
CREATE INDEX idx_email_queue_scheduled ON email_queue(send_after) 
WHERE send_after IS NOT NULL AND status = 'pending';
CREATE INDEX idx_email_queue_priority ON email_queue(priority, created_at)
WHERE status = 'pending';
CREATE INDEX idx_email_queue_type ON email_queue(email_type);
CREATE INDEX idx_email_queue_recipient ON email_queue(recipient_email);
CREATE INDEX idx_email_queue_user ON email_queue(recipient_user_id) 
WHERE recipient_user_id IS NOT NULL;

-- Composite index for processing
CREATE INDEX idx_email_queue_processing ON email_queue(status, priority DESC, send_after NULLS FIRST, created_at)
WHERE status = 'pending';

-- Comments
COMMENT ON TABLE email_queue IS 'Queue for sending emails asynchronously';
COMMENT ON COLUMN email_queue.template_data IS 'Variables to populate email template';
COMMENT ON COLUMN email_queue.send_after IS 'Scheduled send time (NULL = send immediately)';
```

---

## 5. Triggers & Functions

### 5.1 Auto-Update Timestamps

```sql
-- ============================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
CREATE TRIGGER trg_users_updated
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_routes_updated
    BEFORE UPDATE ON routes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_audits_updated
    BEFORE UPDATE ON audits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_audit_sections_updated
    BEFORE UPDATE ON audit_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_issues_updated
    BEFORE UPDATE ON issues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_recommendations_updated
    BEFORE UPDATE ON recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 5.2 Route Geometry Calculations

```sql
-- ============================================
-- TRIGGER: Auto-calculate route geometry fields
-- ============================================

CREATE OR REPLACE FUNCTION update_route_geometry()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate bounding box
    NEW.bbox = ST_Envelope(NEW.geometry);
    
    -- Calculate center point
    NEW.center_point = ST_Centroid(NEW.geometry);
    
    -- Calculate distance in meters
    NEW.distance_meters = ROUND(ST_Length(NEW.geometry::geography)::NUMERIC, 2);
    
    -- Update timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_route_geometry
    BEFORE INSERT OR UPDATE OF geometry ON routes
    FOR EACH ROW
    EXECUTE FUNCTION update_route_geometry();

COMMENT ON FUNCTION update_route_geometry IS 'Auto-calculates bbox, center_point, and distance when route geometry changes';
```

### 5.3 Audit Score Calculations

```sql
-- ============================================
-- TRIGGER: Auto-calculate audit scores
-- ============================================

CREATE OR REPLACE FUNCTION update_audit_scores()
RETURNS TRIGGER AS $$
DECLARE
    school_route BOOLEAN;
    section_count INTEGER;
BEGIN
    -- Get school route flag
    SELECT is_school_route INTO school_route
    FROM audits
    WHERE id = NEW.audit_id;
    
    -- Update audit with all section scores
    UPDATE audits
    SET
        footpaths_score = (SELECT score FROM audit_sections WHERE audit_id = NEW.audit_id AND section = 'footpaths'),
        facilities_score = (SELECT score FROM audit_sections WHERE audit_id = NEW.audit_id AND section = 'facilities'),
        crossings_score = (SELECT score FROM audit_sections WHERE audit_id = NEW.audit_id AND section = 'crossing_road'),
        behaviour_score = (SELECT score FROM audit_sections WHERE audit_id = NEW.audit_id AND section = 'road_user_behaviour'),
        safety_score = (SELECT score FROM audit_sections WHERE audit_id = NEW.audit_id AND section = 'safety'),
        look_feel_score = (SELECT score FROM audit_sections WHERE audit_id = NEW.audit_id AND section = 'look_and_feel'),
        school_gates_score = (SELECT score FROM audit_sections WHERE audit_id = NEW.audit_id AND section = 'school_gates'),
        
        -- Calculate total score
        total_score = (
            SELECT SUM(score)
            FROM audit_sections
            WHERE audit_id = NEW.audit_id
        ),
        
        -- Calculate max possible score
        max_possible_score = (
            SELECT COUNT(*) * 5
            FROM audit_sections
            WHERE audit_id = NEW.audit_id
        ),
        
        -- Calculate normalized score (0-5 scale)
        normalized_score = (
            SELECT ROUND((SUM(score)::DECIMAL / COUNT(*))::NUMERIC, 2)
            FROM audit_sections
            WHERE audit_id = NEW.audit_id
        ),
        
        -- Determine walkability rating
        walkability_rating = (
            CASE
                WHEN (SELECT AVG(score) FROM audit_sections WHERE audit_id = NEW.audit_id) < 1.5 THEN 'Very Poor'
                WHEN (SELECT AVG(score) FROM audit_sections WHERE audit_id = NEW.audit_id) < 2.5 THEN 'Poor'
                WHEN (SELECT AVG(score) FROM audit_sections WHERE audit_id = NEW.audit_id) < 3.5 THEN 'Fair'
                WHEN (SELECT AVG(score) FROM audit_sections WHERE audit_id = NEW.audit_id) < 4.0 THEN 'OK'
                WHEN (SELECT AVG(score) FROM audit_sections WHERE audit_id = NEW.audit_id) < 4.5 THEN 'Good'
                ELSE 'Excellent'
            END
        ),
        
        updated_at = NOW()
    WHERE id = NEW.audit_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_section_audit_scores
    AFTER INSERT OR UPDATE OF score ON audit_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_audit_scores();

COMMENT ON FUNCTION update_audit_scores IS 'Recalculates audit scores when sections are added/updated';
```

### 5.4 Route Statistics Updates

```sql
-- ============================================
-- TRIGGER: Update route statistics
-- ============================================

CREATE OR REPLACE FUNCTION update_route_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update when audit is completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE routes
        SET 
            audit_count = audit_count + 1,
            last_audited = NEW.completed_at,
            avg_score = (
                SELECT ROUND(AVG(normalized_score)::NUMERIC, 2)
                FROM audits
                WHERE route_id = NEW.route_id 
                    AND status = 'completed'
                    AND deleted_at IS NULL
            ),
            updated_at = NOW()
        WHERE id = NEW.route_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_route_stats
    AFTER INSERT OR UPDATE OF status ON audits
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION update_route_stats();

COMMENT ON FUNCTION update_route_stats IS 'Updates route audit count and average score when audit completed';
```

### 5.5 User Statistics Updates

```sql
-- ============================================
-- TRIGGER: Update user statistics
-- ============================================

CREATE OR REPLACE FUNCTION update_user_audit_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE users
        SET 
            audit_count = audit_count + 1,
            last_audit_date = NEW.audit_date,
            updated_at = NOW()
        WHERE id = NEW.coordinator_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_audit_stats
    AFTER INSERT OR UPDATE OF status ON audits
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION update_user_audit_stats();
```

### 5.6 Audit Duration Calculation

```sql
-- ============================================
-- TRIGGER: Calculate audit duration
-- ============================================

CREATE OR REPLACE FUNCTION calculate_audit_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL THEN
        NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_duration
    BEFORE INSERT OR UPDATE OF start_time, end_time ON audits
    FOR EACH ROW
    EXECUTE FUNCTION calculate_audit_duration();
```

### 5.7 Audit Log Trigger

```sql
-- ============================================
-- TRIGGER: Log important changes
-- ============================================

CREATE OR REPLACE FUNCTION log_audit_changes()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get current user from session (set by application)
    current_user_id := current_setting('app.current_user_id', TRUE)::UUID;
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (
            user_id,
            action,
            entity_type,
            entity_id,
            new_values,
            success,
            created_at
        ) VALUES (
            current_user_id,
            'CREATE',
            'audit',
            NEW.id,
            to_jsonb(NEW),
            TRUE,
            NOW()
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (
            user_id,
            action,
            entity_type,
            entity_id,
            old_values,
            new_values,
            success,
            created_at
        ) VALUES (
            current_user_id,
            'UPDATE',
            'audit',
            NEW.id,
            to_jsonb(OLD),
            to_jsonb(NEW),
            TRUE,
            NOW()
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (
            user_id,
            action,
            entity_type,
            entity_id,
            old_values,
            success,
            created_at
        ) VALUES (
            current_user_id,
            'DELETE',
            'audit',
            OLD.id,
            to_jsonb(OLD),
            TRUE,
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_audit_changes
    AFTER INSERT OR UPDATE OR DELETE ON audits
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

-- Similar triggers for other critical tables
-- (issues, recommendations, users, routes)
```

---

*[Document continues with Views, Indexes, Migrations, etc...]*

---

## Document Control

**Last Updated:** 2025-01-11  
**Next Review:** 2025-02-01

**Version History:**
- v1.0 (2025-01-11): Initial comprehensive database specification

**Related Documents:**
- Part 1: Main PRD & Architecture
- Part 3: API Complete Specification
- Part 4: Frontend Complete Implementation

---

**END OF PART 2 (Database Specification)**
