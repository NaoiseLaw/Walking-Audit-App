# Technical Product Requirements Document (PRD)
# Walking Audit Web Application

**Version:** 1.0  
**Last Updated:** January 2025  
**Document Owner:** Product & Engineering  
**Status:** Draft for Development

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [System Architecture](#3-system-architecture)
4. [Database Schema](#4-database-schema)
5. [API Specifications](#5-api-specifications)
6. [Frontend Components](#6-frontend-components)
7. [User Flows](#7-user-flows)
8. [Feature Specifications](#8-feature-specifications)
9. [Technical Requirements](#9-technical-requirements)
10. [Security & Compliance](#10-security--compliance)
11. [Performance Requirements](#11-performance-requirements)
12. [Testing Strategy](#12-testing-strategy)
13. [Deployment](#13-deployment)
14. [Success Metrics](#14-success-metrics)

---

## 1. Executive Summary

### 1.1 Purpose

This document specifies the technical requirements for building a Progressive Web Application (PWA) that digitizes the Irish National Transport Authority's Universal Design Walkability Audit Tool. The application enables community groups, local authorities, and coordinators to conduct, record, and analyze walking infrastructure audits with GPS-tagged photos, offline capability, and automated reporting.

### 1.2 Problem Statement

Currently, walkability audits in Ireland are conducted on paper, requiring:

- Manual data entry and analysis (2+ hours per audit)
- No GPS location data for issues
- Inconsistent reporting formats
- No central database for comparison
- Difficult to aggregate insights across audits

### 1.3 Solution Overview

A mobile-first web application that:

- Digitizes the 7-section NTA audit form
- Captures GPS-tagged photos and issue locations
- Works offline in rural areas
- Auto-generates PDF reports with radar charts
- Centralizes data for local authorities
- **Reduces audit-to-report time from 2+ hours to 45 minutes**

### 1.4 Success Criteria

- **Primary:** 100+ audits completed in first 6 months
- **Secondary:** 90% user satisfaction score
- **Technical:** 99% uptime, <3s page load time, offline functionality

### 1.5 Target Users

| User Type | Role | Primary Goals |
|-----------|------|---------------|
| **Auditor** | Community member | Complete audit quickly, submit feedback |
| **Coordinator** | Facilitator | Organize audits, compile reports |
| **LA Admin** | Local Authority officer | Review audits, track improvements, respond to recommendations |
| **System Admin** | Technical operator | Manage system, user permissions, data exports |

---

## 2. Product Overview

### 2.1 Core Value Proposition

For local authorities and community groups who need to assess walking infrastructure quality, the Walking Audit App is a digital audit platform that reduces audit time by 60% and provides actionable, location-specific insights unlike paper-based methods which are slow, inconsistent, and lack spatial data.

### 2.2 Key Features (MVP)

#### Phase 1 - MVP (3 months)
- ✅ User authentication & role management
- ✅ Digital audit form (7 sections from NTA tool)
- ✅ Route drawing on Google Maps
- ✅ Photo upload with GPS tagging
- ✅ Offline mode with background sync
- ✅ Basic PDF report generation
- ✅ Dashboard for viewing audits

#### Phase 2 - Enhanced (6 months)
- ⭐ Enhanced audit questions (gradient, transport, permeability)
- ⭐ Radar chart visualization (Healthy Streets style)
- ⭐ Central database with analytics dashboard
- ⭐ Before/after comparison tool
- ⭐ Email notifications & reminders

#### Phase 3 - Advanced (12 months)
- 🚀 Training module integration
- 🚀 AI-assisted virtual audits using Street View
- 🚀 Integration with external data APIs (traffic, air quality)
- 🚀 Heatmap & predictive analytics
- 🚀 Mobile native apps (iOS/Android)

### 2.3 Out of Scope (v1.0)

- ❌ Real-time collaborative editing (multiple users editing same audit simultaneously)
- ❌ Video recording capability
- ❌ Automated issue detection using AI (reserved for Phase 3)
- ❌ Integration with project management tools (Jira, Asana)
- ❌ Public-facing audit results (all data private to organization)

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                          │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │          Progressive Web App (PWA)                    │ │
│  │                                                       │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │ │
│  │  │   React    │  │   Redux    │  │  Service   │    │ │
│  │  │ Components │  │   Store    │  │  Worker    │    │ │
│  │  └────────────┘  └────────────┘  └────────────┘    │ │
│  │                                                       │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │ │
│  │  │  IndexedDB │  │ Google Maps│  │  Chart.js  │    │ │
│  │  │  (Offline) │  │    API     │  │  (Radar)   │    │ │
│  │  └────────────┘  └────────────┘  └────────────┘    │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                         API TIER                            │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              Node.js / Express Server                 │ │
│  │                                                       │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │ │
│  │  │   Auth     │  │   Audit    │  │   Photo    │    │ │
│  │  │  Service   │  │  Service   │  │  Service   │    │ │
│  │  └────────────┘  └────────────┘  └────────────┘    │ │
│  │                                                       │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │ │
│  │  │   Report   │  │    Sync    │  │   Email    │    │ │
│  │  │  Service   │  │  Service   │  │  Service   │    │ │
│  │  └────────────┘  └────────────┘  └────────────┘    │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                       DATA TIER                             │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  PostgreSQL  │  │   Firebase   │  │     Redis    │    │
│  │  + PostGIS   │  │   Storage    │  │    Cache     │    │
│  │  (Spatial)   │  │   (Photos)   │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Google Maps  │  │  SendGrid    │  │     EPA      │    │
│  │     API      │  │   (Email)    │  │  Air Quality │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Technology Stack

#### Frontend
```yaml
framework: Next.js 14 (React 18)
language: TypeScript
state_management: Redux Toolkit + RTK Query
styling: Tailwind CSS 3.x
maps: Google Maps JavaScript API
charts: Chart.js 4.x
offline: Workbox (Service Worker)
local_storage: Dexie.js (IndexedDB wrapper)
forms: React Hook Form + Zod validation
build: Vite / Next.js built-in
testing: Jest + React Testing Library
```

#### Backend
```yaml
runtime: Node.js 20 LTS
framework: Express.js 4.x
language: TypeScript
api_style: RESTful + WebSocket (future)
validation: Zod
auth: Passport.js + JWT
orm: Prisma
file_upload: Multer
pdf_generation: Puppeteer
email: Nodemailer + SendGrid
cron_jobs: node-cron
testing: Jest + Supertest
```

#### Database
```yaml
primary: PostgreSQL 16
spatial_extension: PostGIS 3.4
caching: Redis 7.x
photo_storage: Firebase Storage / AWS S3
search: PostgreSQL Full-Text Search
migrations: Prisma Migrate
backup: pg_dump daily + WAL archiving
```

#### Infrastructure
```yaml
hosting_frontend: Vercel
hosting_backend: Railway / Render
cdn: Cloudflare
monitoring: Sentry + LogRocket
analytics: PostHog (privacy-first)
uptime: UptimeRobot
ci_cd: GitHub Actions
```

### 3.3 Component Architecture

```
src/
├── app/                          # Next.js app directory
│   ├── (auth)/                   # Auth layout group
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # Dashboard layout group
│   │   ├── page.tsx              # Dashboard home
│   │   ├── audits/
│   │   │   ├── page.tsx          # Audits list
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx      # Audit detail
│   │   │   │   ├── edit/
│   │   │   │   └── report/
│   │   │   └── new/
│   │   │       └── page.tsx      # Create audit
│   │   ├── routes/
│   │   └── settings/
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   ├── audits/
│   │   ├── photos/
│   │   └── reports/
│   └── layout.tsx                # Root layout
│
├── components/                   # React components
│   ├── audit/
│   │   ├── AuditForm/
│   │   │   ├── index.tsx
│   │   │   ├── FootpathsSection.tsx
│   │   │   ├── FacilitiesSection.tsx
│   │   │   └── ...
│   │   ├── ParticipantForm.tsx
│   │   └── AuditStepper.tsx
│   │
│   ├── map/
│   │   ├── WalkingAuditMap.tsx
│   │   ├── RouteDrawer.tsx
│   │   └── IssueMarker.tsx
│   │
│   ├── report/
│   │   ├── RadarChart.tsx
│   │   └── ScoreBreakdown.tsx
│   │
│   └── ui/                       # Reusable UI components
│       ├── Button.tsx
│       ├── Input.tsx
│       └── ...
│
├── lib/                          # Utilities & services
│   ├── api/
│   │   ├── client.ts
│   │   └── audits.ts
│   ├── db/
│   │   └── indexeddb.ts
│   ├── sync/
│   │   └── SyncManager.ts
│   └── validation/
│       └── auditSchema.ts
│
├── store/                        # Redux store
│   ├── index.ts
│   └── slices/
│       └── auditSlice.ts
│
├── hooks/                        # Custom hooks
│   ├── useAudit.ts
│   └── useOfflineSync.ts
│
└── types/                        # TypeScript types
    ├── audit.ts
    └── user.ts
```

---

## 4. Database Schema

### 4.1 Core Tables

#### USERS

```sql
CREATE TABLE users (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Authentication
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    
    -- Profile
    name VARCHAR(255) NOT NULL,
    profile_photo_url TEXT,
    
    -- Role & Organization
    role user_role DEFAULT 'auditor',
    organization VARCHAR(255),
    county VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    
    -- Soft delete
    deleted_at TIMESTAMP NULL,
    
    -- Constraints
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

#### ROUTES

```sql
CREATE TABLE routes (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Location
    town_city VARCHAR(255) NOT NULL,
    county VARCHAR(100) NOT NULL,
    
    -- Geometry (PostGIS)
    geometry GEOMETRY(LineString, 4326) NOT NULL,
    
    -- Calculated Fields
    distance_meters DECIMAL(10,2),
    bbox GEOMETRY(Polygon, 4326),
    
    -- Enhanced Data
    avg_gradient_percent DECIMAL(4,2),
    max_gradient_percent DECIMAL(4,2),
    permeability_score INTEGER CHECK (permeability_score BETWEEN 1 AND 5),
    has_public_transport BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Soft delete
    deleted_at TIMESTAMP NULL
);

-- Spatial indexes (critical for performance)
CREATE INDEX idx_routes_geometry ON routes USING GIST(geometry);
CREATE INDEX idx_routes_bbox ON routes USING GIST(bbox);
```

#### AUDITS

```sql
CREATE TABLE audits (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE RESTRICT,
    coordinator_id UUID NOT NULL REFERENCES users(id),
    
    -- Basic Details
    audit_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    weather VARCHAR(100),
    
    -- Context
    is_school_route BOOLEAN DEFAULT FALSE,
    school_name VARCHAR(255),
    
    -- Status
    status audit_status DEFAULT 'draft',
    
    -- Scores (auto-calculated)
    footpaths_score INTEGER CHECK (footpaths_score BETWEEN 1 AND 5),
    facilities_score INTEGER CHECK (facilities_score BETWEEN 1 AND 5),
    crossings_score INTEGER CHECK (crossings_score BETWEEN 1 AND 5),
    behaviour_score INTEGER CHECK (behaviour_score BETWEEN 1 AND 5),
    safety_score INTEGER CHECK (safety_score BETWEEN 1 AND 5),
    look_feel_score INTEGER CHECK (look_feel_score BETWEEN 1 AND 5),
    school_gates_score INTEGER CHECK (school_gates_score BETWEEN 1 AND 5),
    
    total_score INTEGER,
    max_possible_score INTEGER,
    walkability_rating VARCHAR(20),
    
    -- Report
    report_pdf_url TEXT,
    report_generated_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    
    -- Version (for conflict resolution)
    version INTEGER DEFAULT 1,
    
    -- Soft delete
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_audits_route ON audits(route_id);
CREATE INDEX idx_audits_status ON audits(status);
CREATE INDEX idx_audits_date ON audits(audit_date DESC);
```

#### AUDIT_SECTIONS

```sql
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
    responses JSONB NOT NULL DEFAULT '{}',
    
    -- Free Text
    comments TEXT,
    problem_areas TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraint: One section per audit
    UNIQUE(audit_id, section)
);

CREATE INDEX idx_sections_audit ON audit_sections(audit_id);
CREATE INDEX idx_sections_responses ON audit_sections USING GIN(responses);
```

#### ISSUES

```sql
CREATE TABLE issues (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    section section_name NOT NULL,
    
    -- Location (PostGIS Point)
    location GEOMETRY(Point, 4326) NOT NULL,
    location_description TEXT,
    
    -- Classification
    category issue_category NOT NULL,
    severity issue_severity DEFAULT 'medium',
    
    -- Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- LA Response
    la_status VARCHAR(50) DEFAULT 'open',
    la_response TEXT,
    la_acknowledged_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Soft delete
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_issues_audit ON issues(audit_id);
CREATE INDEX idx_issues_location ON issues USING GIST(location);
CREATE INDEX idx_issues_severity ON issues(severity);
```

#### PHOTOS

```sql
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
    file_size_kb INTEGER,
    
    -- Location (extracted from EXIF)
    location GEOMETRY(Point, 4326),
    
    -- EXIF Data
    taken_at TIMESTAMP,
    exif_data JSONB,
    
    -- Who Uploaded
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    
    -- Soft delete
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_photos_audit ON photos(audit_id);
CREATE INDEX idx_photos_location ON photos USING GIST(location) WHERE location IS NOT NULL;
```

### 4.2 Data Validation (Zod Schemas)

```typescript
import { z } from 'zod';

// Enums
export const UserRole = z.enum(['auditor', 'coordinator', 'la_admin', 'system_admin']);
export const SectionName = z.enum([
  'footpaths',
  'facilities',
  'crossing_road',
  'road_user_behaviour',
  'safety',
  'look_and_feel',
  'school_gates'
]);
export const IssueSeverity = z.enum(['low', 'medium', 'high', 'critical']);

// Location Schema
export const LocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});

// Audit Section Schema
export const AuditSectionSchema = z.object({
  section: SectionName,
  score: z.number().int().min(1).max(5),
  responses: z.record(z.unknown()),
  comments: z.string().max(2000).optional(),
  problem_areas: z.array(z.string()).optional()
});

// Create Audit Schema
export const CreateAuditSchema = z.object({
  route_id: z.string().uuid(),
  audit_date: z.string().datetime().or(z.date()),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  weather: z.string().max(100).optional(),
  is_school_route: z.boolean().default(false),
  
  participants: z.array(ParticipantSchema).min(1).max(50),
  sections: z.array(AuditSectionSchema).min(6).max(7),
  
  would_walk_more: z.boolean().optional()
});
```

---

## 5. API Specifications

### 5.1 API Design Principles

```yaml
architecture: RESTful
base_url: https://api.walkingaudit.ie/v1
authentication: Bearer JWT
content_type: application/json
error_format: RFC 7807 Problem Details
rate_limiting: 100 requests/minute per user
versioning: URL path (/v1/, /v2/)
```

### 5.2 Authentication Endpoints

#### POST /auth/register

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "role": "auditor",
  "organization": "Dublin City Council"
}
```

**Response 201 Created:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "auditor",
    "created_at": "2025-01-15T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 86400
}
```

#### POST /auth/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response 200 OK:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "auditor"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 86400
}
```

### 5.3 Route Endpoints

#### GET /routes

**Request:**
```
GET /v1/routes?county=Dublin&limit=20&offset=0
Authorization: Bearer {token}
```

**Response 200 OK:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Terenure to Grand Canal",
      "town_city": "Dublin",
      "county": "Dublin",
      "distance_meters": 2860,
      "geometry": {
        "type": "LineString",
        "coordinates": [[-6.2582, 53.3169], [-6.2547, 53.3223]]
      },
      "audit_count": 3,
      "avg_score": 3.2,
      "created_at": "2024-12-01T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

### 5.4 Audit Endpoints

#### POST /audits

**Request:**
```json
{
  "route_id": "550e8400-e29b-41d4-a716-446655440000",
  "audit_date": "2025-01-15",
  "start_time": "14:30",
  "weather": "Sunny, 12°C",
  "is_school_route": false,
  
  "participants": [
    {
      "age_group": "26-64",
      "sex": "female",
      "abilities": ["wheelchair_user"]
    }
  ],
  
  "sections": [
    {
      "section": "footpaths",
      "score": 3,
      "responses": {
        "main_problems": ["not_wide_enough"],
        "surface_condition": ["cracks"]
      },
      "comments": "Narrow footpaths force wheelchair users into road"
    }
  ],
  
  "would_walk_more": true
}
```

**Response 201 Created:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "route_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "total_score": 15,
  "walkability_rating": "OK",
  "created_at": "2025-01-15T16:05:00Z"
}
```

#### GET /audits/:id

**Response 200 OK:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "route": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Terenure to Grand Canal",
    "county": "Dublin"
  },
  "audit_date": "2025-01-15",
  "status": "completed",
  "sections": [...],
  "issues": [...],
  "recommendations": [...],
  "scores": {
    "footpaths": 3,
    "facilities": 2,
    "crossings": 3,
    "behaviour": 3,
    "safety": 2,
    "look_feel": 2
  },
  "total_score": 15,
  "report_pdf_url": "https://storage.walkingaudit.ie/reports/660e8400.pdf"
}
```

### 5.5 Error Responses

All errors follow RFC 7807 Problem Details format:

```json
{
  "type": "https://api.walkingaudit.ie/errors/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "Invalid input data",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

**Common Error Codes:**
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## 6. Frontend Components

### 6.1 Key Component Specifications

#### AuditWizard Component

Multi-step form for creating/editing audits with:
- 8-step wizard (setup → 7 sections → recommendations → review)
- Auto-save to IndexedDB every 30 seconds
- Progress indicator
- Validation per step
- Offline support

```typescript
interface AuditWizardProps {
  mode: 'create' | 'edit';
  auditId?: string;
  routeId?: string;
  onComplete: (auditId: string) => void;
  onCancel: () => void;
}

const STEPS = [
  { id: 'setup', label: 'Audit Setup' },
  { id: 'participants', label: 'Participants' },
  { id: 'footpaths', label: 'Footpaths' },
  { id: 'facilities', label: 'Facilities' },
  { id: 'crossings', label: 'Crossing the Road' },
  { id: 'behaviour', label: 'Road User Behaviour' },
  { id: 'safety', label: 'Safety' },
  { id: 'look_feel', label: 'Look and Feel' },
  { id: 'school_gates', label: 'School Gates', conditional: true },
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'review', label: 'Review & Submit' }
];
```

#### RadarChart Component

Displays walkability scores as radar/spider chart (Healthy Streets style):
- 5-point scale visualization
- Comparison overlay (area average)
- Interactive tooltips
- Responsive sizing

```typescript
interface RadarChartProps {
  scores: {
    footpaths: number;
    facilities: number;
    crossings: number;
    behaviour: number;
    safety: number;
    look_feel: number;
    school_gates?: number;
  };
  comparison?: {
    label: string;
    scores: number[];
  };
  size?: 'small' | 'medium' | 'large';
}
```

#### PhotoCapture Component

Camera interface with GPS tagging:
- Live camera feed
- GPS indicator
- EXIF data extraction
- Image compression (<1MB)
- Location fallback

---

## 7. User Flows

### 7.1 Complete Audit Flow (Happy Path)

```
1. AUTHENTICATION
   → User logs in or registers

2. DASHBOARD
   → User clicks "Create New Audit"

3. ROUTE SELECTION
   → User draws route on map OR selects existing route
   → System calculates distance & gradient

4. AUDIT DETAILS
   → Date, time, weather, school route checkbox

5. PARTICIPANTS
   → Add 1+ participants with demographics & abilities

6. SECTION 1-7: AUDIT QUESTIONS
   → For each section:
      - Answer checkbox questions
      - Add comments
      - Log issues (optional)
      - Take photos (optional)
      - Rate section 1-5

7. RECOMMENDATIONS
   → Add 1-10 priority-ordered recommendations

8. FINAL QUESTIONS
   → Enjoyability rating, liked/disliked, would walk more

9. REVIEW & SUBMIT
   → Summary screen with all data
   → User submits

10. PROCESSING
    → Online: Saves to database, generates PDF
    → Offline: Saves to IndexedDB, queues for sync

11. COMPLETION
    → Success message with links to report
```

### 7.2 Offline Audit Flow

```
User starts audit while offline:
1. App detects no connection
2. Shows banner: "📶 Offline Mode - Data will sync when online"
3. User proceeds normally through all steps
4. All data saved to IndexedDB
5. On submit:
   - Audit marked as "pending_sync"
   - Added to sync queue
6. When connection restored:
   - Service Worker triggers background sync
   - Uploads photos first
   - Then uploads audit data
   - Generates PDF on server
   - Updates status to "completed"
```

---

## 8. Feature Specifications

### 8.1 Offline Functionality

**Requirements:**
- App must work 100% offline after initial load
- All audit data stored in IndexedDB
- Photos stored as blobs (compressed to <1MB each)
- Background sync when connection restored
- User notified of sync status

**Sync Priority:**
1. **High:** Completed audits
2. **Medium:** Photos
3. **Low:** Draft audits

### 8.2 Photo Management

**Requirements:**
- Max 50 photos per audit
- Auto-compress to <1MB per photo
- Extract and preserve EXIF data (GPS, timestamp)
- Generate thumbnails (200x200px)
- Support offline storage

**Photo Pipeline:**
```
1. Capture → Camera API + EXIF extraction
2. Compress → If >1MB, compress to ~800KB
3. Local Storage → Save to IndexedDB as blob
4. Upload → When online, upload to cloud storage
5. Display → Show thumbnail in galleries
```

### 8.3 PDF Report Generation

**Requirements:**
- Auto-generate within 30 seconds of submission
- Include all audit data, charts, maps, photos
- 15-20 pages typical

**Report Structure:**
1. Cover Page (route, date, overall score)
2. Executive Summary (key stats & findings)
3. Radar Chart (full page visualization)
4. Detailed Findings (section by section)
5. Issue Map (static Google Maps image)
6. Recommendations (priority ordered)
7. Photo Appendix (up to 12 photos)

### 8.4 Google Maps Integration

**Features Required:**
- Route drawing with snap-to-roads
- Issue pin placement with drag
- Photo markers with thumbnails
- Heatmap layer for issue density
- Search for addresses/places
- Elevation API for gradient calculation

**APIs Used:**
- Maps JavaScript API
- Places API
- Geocoding API
- Directions API
- Elevation API
- Roads API

---

## 9. Technical Requirements

### 9.1 Browser Support

**Supported Browsers:**
- Chrome/Edge 90+ (Desktop & Mobile)
- Safari 14+ (Desktop & iOS)
- Firefox 88+
- Samsung Internet 14+

**Required Features:**
- Service Workers (for offline)
- IndexedDB (for offline storage)
- Geolocation API (for GPS)
- Camera API (for photos)

### 9.2 Device Requirements

**Minimum:**
- **Mobile:** iOS 14+ / Android 10+, 2GB RAM, GPS, Camera
- **Desktop:** Windows 10 / macOS 10.15, 4GB RAM

### 9.3 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint | <1.5s | Lighthouse |
| Time to Interactive | <3.5s | Lighthouse |
| API Response Time (p95) | <500ms | Server logs |
| Photo Upload Time | <5s per photo | Client timer |
| PDF Generation Time | <30s | Server logs |

---

## 10. Security & Compliance

### 10.1 Authentication

**JWT Tokens:**
- HS256 algorithm
- Token expiry: 24 hours
- Refresh tokens: 30 days
- Bcrypt password hashing (cost: 12)

**Password Requirements:**
- Min 8 characters
- 1 uppercase, 1 lowercase
- 1 number, 1 special char

### 10.2 GDPR Compliance

**Data Protection:**
- ✅ Data minimization
- ✅ Explicit consent for photos
- ✅ Right to access (data export)
- ✅ Right to erasure (soft delete with 30-day retention)
- ✅ Data portability (JSON/ZIP exports)

**Photo Privacy:**
- Auto-blur faces (future)
- Remove EXIF location on request
- Private photo option

### 10.3 Data Security

**Encryption:**
- TLS 1.3 for all connections
- AES-256 for database backups
- Encrypted photos at rest

**Input Validation:**
- Client AND server validation
- Zod schemas
- Parameterized queries (Prisma ORM)
- XSS protection (CSP)
- CSRF protection

### 10.4 Backup & Recovery

```yaml
database:
  full_backup: Daily at 02:00 UTC, 30-day retention
  incremental_backup: Hourly, 7-day retention
  point_in_time_recovery: Enabled, 7-day retention

photos:
  backup: Continuous replication, permanent retention
  
disaster_recovery:
  RTO: 4 hours
  RPO: 1 hour
```

---

## 11. Performance Requirements

### 11.1 Scalability Targets

**Year 1 Projections:**
- 5,000 registered users
- 10,000 audits/year
- 80,000 photos/year
- 50,000 API requests/day peak

### 11.2 Caching Strategy

**Redis Caching:**
```
user: 1 hour TTL
route: 2 hours TTL
audit: 30 minutes TTL
analytics: 5 minutes TTL
```

---

## 12. Testing Strategy

### 12.1 Unit Testing

**Coverage Target:** 80%
**Framework:** Jest + React Testing Library

**Test Areas:**
- Component rendering
- Form validation
- Utility functions
- State management

### 12.2 Integration Testing

**Framework:** Jest + Supertest

**Test Areas:**
- API endpoints
- Database operations
- Authentication flow
- File uploads

### 12.3 E2E Testing

**Framework:** Playwright

**Test Scenarios:**
- Complete audit flow (happy path)
- Offline audit creation & sync
- Photo capture & upload
- PDF generation & download

---

## 13. Deployment

### 13.1 Infrastructure

```yaml
frontend:
  platform: Vercel
  plan: Pro

backend:
  platform: Railway / Render
  plan: Pro
  features:
    - Auto-scaling (3-10 instances)
    - Load balancing

database:
  provider: Railway PostgreSQL / Supabase
  plan: Pro
  specs:
    - PostgreSQL 16 + PostGIS 3.4
    - 8GB RAM, 100GB SSD
    - Automatic backups

cache:
  provider: Railway Redis / Upstash
  plan: Pro

storage:
  provider: Firebase Storage / AWS S3
  features:
    - CDN distribution
    - Image optimization
```

### 13.2 CI/CD Pipeline

**GitHub Actions Workflow:**
```yaml
1. Test: Lint, type-check, unit tests, integration tests
2. Build: Compile TypeScript, bundle assets
3. Deploy Preview: Vercel preview deployments for PRs
4. Deploy Production: Vercel + Railway on merge to main
5. Migrations: Run database migrations
6. Notify: Slack notification on completion
```

### 13.3 Environment Variables

```bash
# Application
NODE_ENV=production
APP_URL=https://app.walkingaudit.ie
API_URL=https://api.walkingaudit.ie

# Database
DATABASE_URL=postgresql://user:pass@host:5432/walkingaudit

# Authentication
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# Google Maps
GOOGLE_MAPS_API_KEY=...

# Storage
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...

# Email
SENDGRID_API_KEY=...
```

---

## 14. Success Metrics

### 14.1 Key Performance Indicators (KPIs)

**User Adoption:**
- 100+ audits completed in first 6 months
- 50+ registered users in first 3 months
- 20+ active organizations

**Engagement:**
- Average 2 audits per user per month
- 80%+ completion rate for started audits
- 90%+ user satisfaction score

**Technical:**
- 99%+ uptime
- <3s average page load time
- <5% offline sync failure rate

**Impact:**
- 60% reduction in audit-to-report time
- 100% GPS-tagged issues
- 50% increase in recommendations implemented by LAs

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **NTA** | National Transport Authority (Ireland) |
| **LA** | Local Authority (county/city council) |
| **PWA** | Progressive Web App |
| **PostGIS** | Spatial database extension for PostgreSQL |
| **GeoJSON** | JSON format for geographic features |
| **EXIF** | Exchangeable Image File Format (photo metadata) |

---

## Appendix B: References

1. **NTA Universal Design Audit Tool** - Original paper-based audit methodology
2. **Healthy Streets Indicators** - Walkability assessment framework
3. **Irish Urban Walkability Research** - Academic research on Irish walkability

---

**Document Control:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-11 | Product & Engineering Team | Initial draft |

---

**Approval:**

- [ ] Product Manager
- [ ] Lead Engineer
- [ ] CTO
- [ ] Project Sponsor

---

**Next Steps:**

1. ✅ Technical architecture review
2. ⏳ Database schema finalization
3. ⏳ API endpoint development
4. ⏳ Frontend component library setup
5. ⏳ Development environment setup
