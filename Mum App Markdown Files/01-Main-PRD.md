# Walking Audit Web Application
# Technical Product Requirements Document (PRD)

**Version:** 1.0  
**Last Updated:** January 2025  
**Document Owner:** Product & Engineering Team  
**Status:** Ready for Development

---

## Document Suite

This is part of a comprehensive 6-document technical specification:

1. **📋 Main PRD** (This Document) - Executive summary, product overview, system architecture
2. **🗄️ Database Complete** - All schemas, triggers, functions, migrations
3. **🔌 API Complete** - All endpoints with full request/response examples
4. **⚛️ Frontend Complete** - All components with full implementations
5. **⚙️ Backend Services** - Complete service layer, sync manager, utilities
6. **🧪 Testing & DevOps** - Full test suites, CI/CD, deployment

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack](#4-technology-stack)
5. [User Roles & Permissions](#5-user-roles--permissions)
6. [Success Metrics](#6-success-metrics)
7. [Project Timeline](#7-project-timeline)
8. [Appendices](#8-appendices)

---

## 1. Executive Summary

### 1.1 Purpose

This document specifies the technical requirements for building a **Progressive Web Application (PWA)** that digitizes the Irish National Transport Authority's Universal Design Walkability Audit Tool. 

The application enables community groups, local authorities, and coordinators to conduct, record, and analyze walking infrastructure audits with:
- GPS-tagged photos
- Offline capability
- Automated reporting
- Centralized data management

### 1.2 Problem Statement

Currently, walkability audits in Ireland are conducted on paper forms, creating significant challenges:

#### Current State Problems

| Problem | Impact | Frequency |
|---------|--------|-----------|
| **Manual data entry** | 2+ hours per audit for transcription | Every audit |
| **No GPS location data** | Issues can't be mapped accurately | 100% of audits |
| **Inconsistent reporting** | Hard to compare across audits | Ongoing issue |
| **No central database** | Can't aggregate insights | System-wide |
| **Lost/damaged forms** | Data loss, rework required | ~5% of audits |
| **Delayed analysis** | Weeks to generate reports | Every audit |
| **Poor accessibility** | Difficult for people with disabilities to participate | Affects participation |

#### Quantified Impact

- **Time Loss:** Average 2.5 hours per audit on manual processing
- **Cost:** €50,000+ annually in staff time for 500 audits
- **Data Quality:** 15-20% of audits have incomplete location data
- **Participation:** Low participation from people with disabilities due to paper-based barriers

### 1.3 Solution Overview

A mobile-first Progressive Web Application that transforms the audit process:

#### Core Capabilities

**For Auditors (Community Members):**
- ✅ Complete entire audit on mobile device in one session
- ✅ Take GPS-tagged photos of issues
- ✅ Work offline (rural Ireland connectivity)
- ✅ Auto-save progress every 30 seconds
- ✅ Intuitive wizard interface (8 steps)

**For Coordinators (Facilitators):**
- ✅ Organize multi-participant audits
- ✅ Track audit progress in real-time
- ✅ Generate professional PDF reports instantly
- ✅ Email reports to stakeholders
- ✅ Compare results across routes

**For Local Authorities:**
- ✅ Centralized dashboard of all audits in county
- ✅ Respond to issues and recommendations
- ✅ Track implementation status
- ✅ Analytics and trend visualization
- ✅ Export data for GIS systems

**Technical Differentiators:**
- 🚀 **60% faster:** Audit-to-report time reduced from 2+ hours to 45 minutes
- 📍 **100% GPS-tagged:** Every issue has precise location data
- 📶 **Offline-first:** Works completely without internet connection
- 📊 **Automated insights:** Radar charts, heatmaps, comparative analytics
- 🔒 **GDPR compliant:** Built-in privacy controls and data protection

### 1.4 Success Criteria

#### Primary KPIs (6 months)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Audits Completed** | 100+ | Database count |
| **Active Users** | 50+ | Monthly active users |
| **Organizations** | 10+ | Unique organizations registered |
| **User Satisfaction** | 90%+ | Post-audit survey (1-5 scale) |
| **Time Savings** | 60%+ reduction | Average audit-to-report time |

#### Technical KPIs (Ongoing)

| Metric | Target | Monitoring Tool |
|--------|--------|----------------|
| **Uptime** | 99%+ | UptimeRobot |
| **Page Load Time (p95)** | <3s | Lighthouse |
| **API Response Time (p95)** | <500ms | Server logs |
| **Offline Sync Success** | 95%+ | Client telemetry |
| **Photo Upload Success** | 98%+ | Server logs |
| **PDF Generation Time** | <30s | Server logs |

#### Impact KPIs (12 months)

| Metric | Target | Source |
|--------|--------|--------|
| **LA Implementation Rate** | 50%+ of recommendations | LA response data |
| **Repeat Audits** | 30%+ of routes | Database analysis |
| **Data Quality Score** | 95%+ complete | Audit completeness audit |
| **Cost Savings** | €30,000+ | Time tracking analysis |

### 1.5 Target Users

#### User Personas

**1. Community Auditor - Mary (62)**
- Retired teacher, wheelchair user
- Lives in suburban Dublin
- Volunteers with local community group
- Comfortable with smartphone, uses WhatsApp daily
- Needs: Simple interface, large text, offline capability

**2. Coordinator - James (34)**
- Community development officer
- Organizes 10-15 audits per year
- Tech-savvy, uses Google Workspace
- Needs: Bulk operations, reporting, stakeholder communication

**3. LA Admin - Siobhan (45)**
- Senior engineer at Dublin City Council
- Reviews 50+ audits annually
- Uses GIS software daily
- Needs: Analytics dashboard, data export, issue tracking

**4. System Admin - Liam (28)**
- IT officer supporting multiple counties
- Manages user access and data
- Needs: Admin panel, user management, system monitoring

#### User Role Matrix

| Feature | Auditor | Coordinator | LA Admin | System Admin |
|---------|---------|-------------|----------|--------------|
| Create audit | ✓ | ✓ | ✓ | ✓ |
| View own audits | ✓ | ✓ | ✓ | ✓ |
| View all audits | ✗ | Organization | County | All |
| Edit own audits (<24h) | ✓ | ✓ | ✓ | ✓ |
| Delete audits | ✗ | Own | County | All |
| Respond to issues | ✗ | ✗ | ✓ | ✓ |
| View analytics | ✗ | Organization | County | All |
| Manage users | ✗ | Organization | County | All |
| System settings | ✗ | ✗ | ✗ | ✓ |

---

## 2. Product Overview

### 2.1 Core Value Proposition

**For local authorities and community groups** who need to assess walking infrastructure quality, **the Walking Audit App** is a **digital audit platform** that **reduces audit time by 60% and provides actionable, location-specific insights** unlike **paper-based methods** which are **slow, inconsistent, and lack spatial data**.

### 2.2 Product Vision

**"Make every neighborhood walkable by empowering communities with data-driven insights."**

By 2027, we envision:
- 🎯 10,000+ audits completed across Ireland
- 🏙️ All 31 Irish local authorities using the platform
- 📈 50% increase in walkability improvements implemented
- 🌍 Expansion to UK and EU markets

### 2.3 Feature Roadmap

#### Phase 1: MVP (Months 1-3) - Foundation

**Goal:** Launch working product with core audit functionality

**Features:**
- ✅ User authentication & role management
- ✅ Digital audit form (7 sections from NTA tool)
  - Footpaths
  - Facilities  
  - Crossing the Road
  - Road User Behaviour
  - Safety
  - Look and Feel
  - School Gates (conditional)
- ✅ Route drawing on Google Maps
- ✅ Photo upload with GPS tagging
- ✅ Offline mode with background sync
- ✅ Basic PDF report generation
- ✅ Dashboard for viewing audits

**Success Criteria:**
- 10 pilot audits completed
- <5 critical bugs
- 80%+ user satisfaction

**Timeline:** 12 weeks
**Team:** 2 full-stack developers, 1 designer, 1 PM

---

#### Phase 2: Enhanced Features (Months 4-6) - Scale

**Goal:** Add advanced features for power users and LAs

**Features:**
- ⭐ Enhanced audit questions
  - Gradient/slope indicators
  - Public transport proximity
  - Permeability ratings
  - Intersection density
- ⭐ Radar chart visualization (Healthy Streets style)
- ⭐ Central database with analytics dashboard
  - County-level aggregation
  - Trend analysis
  - Comparative benchmarking
- ⭐ Before/after comparison tool
- ⭐ Email notifications & reminders
- ⭐ LA response workflow
  - Issue acknowledgment
  - Implementation tracking
  - Status updates

**Success Criteria:**
- 100+ audits completed
- 5+ local authorities onboarded
- 90%+ user satisfaction

**Timeline:** 12 weeks
**Team:** 3 full-stack developers, 1 designer, 1 PM

---

#### Phase 3: Advanced Analytics (Months 7-12) - Intelligence

**Goal:** Add AI/ML capabilities and predictive insights

**Features:**
- 🚀 Training module integration
  - Video tutorials
  - Interactive guides
  - Certification system
- 🚀 AI-assisted virtual audits using Street View
  - Automated issue detection
  - Pre-populated audit data
  - Human verification workflow
- 🚀 Integration with external data APIs
  - TII/NTA traffic counters
  - EPA air quality data
  - Met Éireann weather data
  - Dublin Agglomeration noise data
- 🚀 Heatmap & predictive analytics
  - Risk scoring
  - Priority recommendations
  - Budget optimization
- 🚀 Mobile native apps (iOS/Android)
  - Better camera integration
  - Push notifications
  - Enhanced offline support

**Success Criteria:**
- 500+ audits completed
- 15+ local authorities onboarded
- AI accuracy >85%
- 95%+ user satisfaction

**Timeline:** 24 weeks
**Team:** 4 full-stack developers, 1 ML engineer, 1 designer, 1 PM

---

#### Phase 4: Scale & Expansion (Year 2+) - Growth

**Future Features:**
- 🔮 Real-time collaborative editing
- 🔮 Public audit results portal
- 🔮 Integration with project management tools
- 🔮 Multi-language support (Irish, Polish, etc.)
- 🔮 Citizen reporting mobile app
- 🔮 Automated GIS data export
- 🔮 International expansion (UK, EU)

---

### 2.4 Out of Scope (v1.0)

To maintain focus and ensure timely delivery, the following are explicitly **not included** in Phase 1:

#### ❌ Deferred to Future Phases

- **Real-time collaborative editing** - Multiple users editing same audit simultaneously
  - *Reason:* Complex conflict resolution, not critical for MVP
  - *Phase:* Phase 4

- **Video recording capability** - Record videos during audits
  - *Reason:* Storage costs, processing complexity
  - *Phase:* TBD based on user feedback

- **Automated issue detection using AI** - Computer vision for issue identification
  - *Reason:* Requires ML model training, Phase 3 feature
  - *Phase:* Phase 3

- **Integration with project management tools** - Jira, Asana, Monday.com
  - *Reason:* Low priority, limited user demand
  - *Phase:* Phase 4

- **Public-facing audit results** - Public portal showing all audits
  - *Reason:* Privacy concerns, LA approval needed
  - *Phase:* Phase 4

#### ❌ Not Planned

- **Social media integration** - Share audits to Facebook, Twitter
  - *Reason:* Privacy risks, not aligned with use case

- **Gamification** - Points, badges, leaderboards
  - *Reason:* Audit quality > quantity

- **Payment processing** - Paid audit services
  - *Reason:* Public service, should be free

---

## 3. System Architecture

### 3.1 High-Level Architecture

The application follows a **3-tier architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                          │
│                   (Progressive Web App)                     │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │          Frontend Application (PWA)                   │ │
│  │                                                       │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │ │
│  │  │   React    │  │   Redux    │  │  Service   │    │ │
│  │  │ Components │  │   Store    │  │  Worker    │    │ │
│  │  │  (Next.js) │  │  (State)   │  │ (Offline)  │    │ │
│  │  └────────────┘  └────────────┘  └────────────┘    │ │
│  │                                                       │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │ │
│  │  │  IndexedDB │  │ Google Maps│  │  Chart.js  │    │ │
│  │  │  (Offline  │  │    API     │  │ (Visualiz- │    │ │
│  │  │  Storage)  │  │ (Mapping)  │  │   ation)   │    │ │
│  │  └────────────┘  └────────────┘  └────────────┘    │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕ 
                    HTTPS / REST APIs
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                         API TIER                            │
│                    (Application Server)                     │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              Node.js / Express Server                 │ │
│  │                   (TypeScript)                        │ │
│  │                                                       │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │ │
│  │  │   Auth     │  │   Audit    │  │   Photo    │    │ │
│  │  │  Service   │  │  Service   │  │  Service   │    │ │
│  │  │ (JWT/Auth) │  │  (CRUD)    │  │ (Upload)   │    │ │
│  │  └────────────┘  └────────────┘  └────────────┘    │ │
│  │                                                       │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │ │
│  │  │   Report   │  │    Sync    │  │   Email    │    │ │
│  │  │  Service   │  │  Service   │  │  Service   │    │ │
│  │  │ (PDF Gen)  │  │ (Offline)  │  │ (SendGrid) │    │ │
│  │  └────────────┘  └────────────┘  └────────────┘    │ │
│  │                                                       │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │ │
│  │  │  Analytics │  │    Route   │  │   Issue    │    │ │
│  │  │  Service   │  │  Service   │  │  Service   │    │ │
│  │  │ (Insights) │  │ (Spatial)  │  │ (Tracking) │    │ │
│  │  └────────────┘  └────────────┘  └────────────┘    │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕ 
                    Database Connections
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                       DATA TIER                             │
│                    (Data Persistence)                       │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  PostgreSQL  │  │   Firebase   │  │     Redis    │    │
│  │   16 + DB    │  │   Storage    │  │   7.x Cache  │    │
│  │   PostGIS    │  │  (Photos &   │  │  (Session &  │    │
│  │  (Spatial    │  │   Reports)   │  │   Temp Data) │    │
│  │    Data)     │  │              │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  Stores:                                                    │
│  - User accounts          - Audit responses                 │
│  - Routes (GeoJSON)       - Photos (cloud URLs)            │
│  - Audits & sections      - Session tokens                 │
│  - Issues (GPS points)    - Cached queries                 │
│  - Recommendations        - Report PDFs                    │
└─────────────────────────────────────────────────────────────┘
                            ↕ 
                    External API Calls
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Google Maps  │  │  SendGrid    │  │     EPA      │    │
│  │     API      │  │   (Email     │  │  (Air Quality│    │
│  │ - Mapping    │  │  Delivery)   │  │    Data)     │    │
│  │ - Geocoding  │  │              │  │              │    │
│  │ - Elevation  │  │              │  │              │    │
│  │ - Roads      │  │              │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  TII/NTA     │  │ Met Éireann  │  │    Sentry    │    │
│  │  (Traffic    │  │  (Weather    │  │   (Error     │    │
│  │   Data)      │  │   Data)      │  │  Tracking)   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Architecture Patterns

#### 3.2.1 Client-Side Architecture

**Progressive Web App (PWA) Pattern**

The frontend is built as a PWA to provide:
- 📱 Mobile-first responsive design
- 📶 Offline functionality
- 🔄 Background sync
- 📲 Installable on home screen
- ⚡ Fast page loads with caching

**Key PWA Features:**

```javascript
// manifest.json
{
  "name": "Walking Audit App",
  "short_name": "WalkAudit",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2196F3",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Service Worker Strategy:**

- **App Shell:** Cached immediately on install
- **API Calls:** Network-first, fallback to cache
- **Images:** Cache-first strategy
- **Photos:** Queue for upload when offline

#### 3.2.2 Server-Side Architecture

**Microservices-Inspired Modular Monolith**

While deployed as a single application, the backend is organized into independent service modules:

```
backend/
├── services/
│   ├── auth/           # Authentication & authorization
│   ├── audit/          # Audit CRUD operations
│   ├── photo/          # Photo upload & processing
│   ├── report/         # PDF generation
│   ├── sync/           # Offline sync handling
│   ├── email/          # Email notifications
│   ├── analytics/      # Data aggregation
│   ├── route/          # Route management
│   └── issue/          # Issue tracking
├── middleware/         # Express middleware
├── utils/              # Shared utilities
└── config/             # Configuration
```

**Benefits:**
- 🔧 Easy to maintain and test
- 📦 Can be split into true microservices later
- 🚀 Simpler deployment initially
- 🔒 Clear separation of concerns

#### 3.2.3 Data Architecture

**Hybrid Storage Strategy**

Different data types optimized for their use case:

| Data Type | Storage | Why |
|-----------|---------|-----|
| **Audit Data** | PostgreSQL | Relational, transactional, complex queries |
| **Spatial Data** | PostGIS | Geographic queries, routing, proximity |
| **Photos** | Firebase Storage | CDN, automatic optimization, scalability |
| **Reports (PDFs)** | Firebase Storage | Large files, permanent storage |
| **Session Data** | Redis | Fast access, automatic expiration |
| **Cache** | Redis | Query results, temporary data |
| **Offline Queue** | IndexedDB (client) | Offline persistence |

#### 3.2.4 Security Architecture

**Defense in Depth Strategy**

Multiple layers of security controls:

```
┌─────────────────────────────────────────┐
│  Layer 1: Network Security              │
│  - CloudFlare DDoS protection           │
│  - TLS 1.3 encryption                   │
│  - WAF (Web Application Firewall)       │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  Layer 2: API Gateway                   │
│  - Rate limiting (100 req/min)          │
│  - Request validation                   │
│  - CORS policies                        │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  Layer 3: Authentication                │
│  - JWT token validation                 │
│  - Token expiration (24h)               │
│  - Refresh token rotation               │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  Layer 4: Authorization                 │
│  - Role-based access control (RBAC)     │
│  - Resource ownership checks            │
│  - Permission middleware                │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  Layer 5: Input Validation              │
│  - Zod schema validation                │
│  - SQL injection prevention (Prisma)    │
│  - XSS protection (sanitization)        │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  Layer 6: Data Protection               │
│  - Encryption at rest (AES-256)         │
│  - Encrypted backups                    │
│  - GDPR compliance                      │
└─────────────────────────────────────────┘
```

### 3.3 Data Flow

#### 3.3.1 Online Audit Creation Flow

```
1. USER ACTION: User opens "Create New Audit"
   └─> Frontend: Load AuditWizard component
   
2. ROUTE SELECTION: User draws route on map
   └─> Google Maps API: Snap to roads, calculate distance
   └─> Store in Redux: Temporary state
   
3. AUDIT FORM: User completes 7 sections
   └─> Auto-save: Every 30 seconds to localStorage
   └─> Photo capture: Store in IndexedDB temporarily
   
4. SUBMISSION: User clicks "Submit Audit"
   └─> Frontend: Validate form data (Zod schemas)
   └─> API Call: POST /api/v1/audits
   
5. SERVER PROCESSING:
   a) Validate authentication (JWT middleware)
   b) Validate data (Zod schemas)
   c) Begin database transaction
   d) Insert audit record
   e) Insert section records
   f) Insert participant records
   g) Insert issue records
   h) Commit transaction
   i) Queue photo uploads (async)
   j) Queue PDF generation (async)
   k) Return audit ID
   
6. BACKGROUND JOBS:
   a) Photo Upload Job:
      - Process queue of photos
      - Compress to <1MB
      - Upload to Firebase Storage
      - Update database with URLs
      - Generate thumbnails
   
   b) PDF Generation Job:
      - Fetch audit data with relations
      - Render HTML template
      - Launch Puppeteer
      - Generate PDF
      - Upload to storage
      - Update audit record
   
7. CLIENT RESPONSE:
   └─> Display success message
   └─> Clear localStorage
   └─> Navigate to audit detail page
   └─> Poll for PDF generation status
```

#### 3.3.2 Offline Audit Creation Flow

```
1. USER GOES OFFLINE: Network drops during audit
   └─> Service Worker: Intercepts failed API calls
   └─> Show notification: "📶 Offline Mode Active"
   
2. AUDIT COMPLETION: User completes audit offline
   └─> All data: Store in IndexedDB
   └─> Photos: Store as blobs in IndexedDB
   └─> Queue entry: Create sync queue item
   
3. USER CLICKS SUBMIT:
   └─> Check online: navigator.onLine === false
   └─> Save to local database
   └─> Show message: "Saved locally. Will sync when online."
   └─> Mark audit as "pending_sync"
   
4. NETWORK RESTORED: Online event fires
   └─> Service Worker: Register background sync
   └─> Trigger: 'sync-audits' event
   
5. BACKGROUND SYNC PROCESS:
   a) Fetch pending audits from IndexedDB
   b) Sort by priority (high: completed, medium: photos, low: drafts)
   c) For each audit:
      - Upload photos first (largest data)
      - Then upload audit data
      - Update sync status
      - Remove from IndexedDB on success
   
6. CONFLICT RESOLUTION (if needed):
   └─> If audit was modified on server:
       - Server version wins
       - Create new version with local changes
       - Notify user of conflict
   
7. COMPLETION:
   └─> Push notification: "Your audit has been synced!"
   └─> Update UI with server IDs
   └─> Trigger PDF generation
```

#### 3.3.3 Photo Upload Pipeline

```
1. CAPTURE:
   └─> Camera API: Get video stream
   └─> Canvas: Draw frame to canvas
   └─> Extract EXIF: GPS, timestamp, device info
   
2. COMPRESSION:
   └─> Check size: if > 1MB
   └─> Reduce dimensions: Max 1920x1080
   └─> Adjust quality: 85% → 70% → 50% until <1MB
   
3. LOCAL STORAGE (if offline):
   └─> IndexedDB: Store blob + metadata
   └─> Link to issue/audit
   └─> Create sync queue entry
   
4. UPLOAD (when online):
   └─> Multipart form data
   └─> Upload to Firebase Storage
   └─> Path: /photos/{audit_id}/{photo_id}.jpg
   
5. SERVER PROCESSING:
   └─> Validate file type (image/jpeg, image/png)
   └─> Validate file size (<5MB original)
   └─> Generate thumbnail: 200x200px
   └─> Extract EXIF data
   └─> Store in database:
       - url: Full size URL
       - thumbnail_url: Thumbnail URL
       - location: GPS coordinates
       - taken_at: Timestamp
       - exif_data: Full EXIF JSON
   
6. CLIENT UPDATE:
   └─> Remove from IndexedDB
   └─> Update UI with cloud URLs
   └─> Show thumbnail in gallery
```

---

## 4. Technology Stack

### 4.1 Frontend Stack

```yaml
Core Framework:
  framework: Next.js 14 (App Router)
  react_version: 18.x
  language: TypeScript 5.x
  
State Management:
  global_state: Redux Toolkit
  api_client: RTK Query
  form_state: React Hook Form
  
Styling:
  css_framework: Tailwind CSS 3.x
  component_library: shadcn/ui (optional)
  icons: Lucide React
  
UI Libraries:
  charts: Chart.js 4.x
  maps: Google Maps JavaScript API
  date_picker: react-datepicker
  drag_drop: dnd-kit
  
Offline Support:
  service_worker: Workbox
  local_database: Dexie.js (IndexedDB wrapper)
  
Validation:
  runtime: Zod
  form_validation: React Hook Form + Zod resolver
  
Build Tools:
  bundler: Next.js built-in (Turbopack)
  package_manager: npm / pnpm
  
Testing:
  unit_tests: Jest + React Testing Library
  e2e_tests: Playwright
  
Code Quality:
  linter: ESLint
  formatter: Prettier
  type_checking: TypeScript compiler
```

**Key Dependencies:**
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "@reduxjs/toolkit": "^2.0.0",
    "react-redux": "^9.0.0",
    "react-hook-form": "^7.49.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "dexie": "^3.2.0",
    "dexie-react-hooks": "^1.1.0",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "@googlemaps/js-api-loader": "^1.16.0",
    "tailwindcss": "^3.4.0",
    "lucide-react": "^0.300.0",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/node": "^20.0.0",
    "jest": "^29.7.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@playwright/test": "^1.40.0",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.0.0",
    "prettier": "^3.1.0"
  }
}
```

### 4.2 Backend Stack

```yaml
Runtime:
  platform: Node.js 20 LTS
  framework: Express.js 4.x
  language: TypeScript 5.x
  
API Architecture:
  style: RESTful
  documentation: OpenAPI 3.0
  
Authentication:
  strategy: Passport.js
  tokens: JWT (jsonwebtoken)
  password_hashing: bcrypt
  
Database:
  orm: Prisma 5.x
  migrations: Prisma Migrate
  
Validation:
  schemas: Zod
  
File Handling:
  uploads: Multer
  storage: Firebase Storage SDK / AWS S3
  
PDF Generation:
  library: Puppeteer
  
Email:
  library: Nodemailer
  provider: SendGrid
  
Job Queue:
  library: Bull (Redis-based)
  scheduler: node-cron
  
Logging:
  library: Winston
  transport: Console + File + Sentry
  
Testing:
  unit_tests: Jest
  integration_tests: Supertest
  
Code Quality:
  linter: ESLint
  formatter: Prettier
  type_checking: TypeScript compiler
```

**Key Dependencies:**
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "typescript": "^5.0.0",
    "@prisma/client": "^5.8.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.0",
    "jsonwebtoken": "^9.0.0",
    "bcrypt": "^5.1.0",
    "zod": "^3.22.0",
    "multer": "^1.4.0",
    "firebase-admin": "^12.0.0",
    "puppeteer": "^21.0.0",
    "nodemailer": "^6.9.0",
    "@sendgrid/mail": "^7.7.0",
    "bull": "^4.11.0",
    "node-cron": "^3.0.0",
    "winston": "^3.11.0",
    "@sentry/node": "^7.90.0",
    "redis": "^4.6.0",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.1.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/node": "^20.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/multer": "^1.4.0",
    "prisma": "^5.8.0",
    "jest": "^29.7.0",
    "supertest": "^6.3.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.0",
    "nodemon": "^3.0.0"
  }
}
```

### 4.3 Database Stack

```yaml
Primary Database:
  engine: PostgreSQL 16
  extensions:
    - PostGIS 3.4 (spatial queries)
    - uuid-ossp (UUID generation)
    - pg_trgm (full-text search)
  
  configuration:
    max_connections: 100
    shared_buffers: 2GB
    effective_cache_size: 6GB
    work_mem: 64MB
    maintenance_work_mem: 512MB
  
  indexes:
    - GiST indexes for spatial data
    - GIN indexes for JSONB
    - B-tree indexes for foreign keys
    - Partial indexes for soft deletes
  
Cache Layer:
  engine: Redis 7.x
  use_cases:
    - Session storage
    - API response cache
    - Rate limiting
    - Job queue
  
  configuration:
    maxmemory: 2GB
    maxmemory_policy: allkeys-lru
    save: "900 1 300 10 60 10000"
  
Object Storage:
  primary: Firebase Storage
  backup: AWS S3 (optional)
  cdn: Cloudflare
  
  organization:
    photos: /photos/{audit_id}/
    reports: /reports/{year}/{month}/
    avatars: /avatars/{user_id}/
```

### 4.4 Infrastructure Stack

```yaml
Frontend Hosting:
  platform: Vercel
  plan: Pro
  features:
    - Automatic deployments from Git
    - Preview deployments for PRs
    - Edge network (global CDN)
    - Automatic SSL
    - DDoS protection
    - Analytics
  
Backend Hosting:
  platform: Railway / Render
  plan: Pro
  features:
    - Auto-scaling (3-10 instances)
    - Load balancing
    - Health checks
    - Automatic restarts
    - Environment management
    - Log aggregation
  
Database Hosting:
  platform: Railway / Supabase / AWS RDS
  plan: Pro
  specs:
    - vCPU: 4
    - RAM: 8GB
    - Storage: 100GB SSD
    - Backups: Daily + point-in-time recovery
    - High availability: Yes
  
CDN:
  provider: Cloudflare
  features:
    - Global edge network
    - DDoS protection
    - WAF (Web Application Firewall)
    - SSL/TLS
    - Bot protection
  
Monitoring:
  uptime: UptimeRobot
  errors: Sentry
  logging: LogRocket / Datadog
  analytics: PostHog (privacy-first)
  
CI/CD:
  platform: GitHub Actions
  triggers:
    - Push to main: Deploy production
    - Push to develop: Deploy staging
    - Pull request: Run tests + deploy preview
  
Domain & DNS:
  registrar: Cloudflare / AWS Route 53
  dns: Cloudflare DNS
  
Email:
  provider: SendGrid
  features:
    - Transactional emails
    - Email templates
    - Delivery tracking
    - Bounce handling
```

### 4.5 Development Tools

```yaml
Version Control:
  system: Git
  hosting: GitHub
  workflow: Git Flow (main, develop, feature/*, hotfix/*)
  
IDE:
  recommended: VS Code
  extensions:
    - ESLint
    - Prettier
    - TypeScript
    - Prisma
    - Tailwind CSS IntelliSense
  
API Testing:
  tools:
    - Postman (API testing)
    - Bruno (open-source alternative)
  collections:
    - All endpoints documented
    - Example requests
    - Test scripts
  
Database Tools:
  gui: pgAdmin / DBeaver
  migrations: Prisma Migrate
  seeding: Prisma Seed
  
Design:
  ui_ux: Figma
  prototyping: Figma
  icons: Lucide Icons / Heroicons
  
Project Management:
  tasks: Linear / Jira
  docs: Notion / Confluence
  communication: Slack
  
Security Scanning:
  dependencies: npm audit / Snyk
  code: SonarQube / CodeQL
  secrets: GitGuardian
```

---

## 5. User Roles & Permissions

### 5.1 Role Definitions

#### 5.1.1 Auditor

**Description:** Community members who conduct walking audits

**Primary Responsibilities:**
- Complete walking audits on assigned routes
- Take photos of issues
- Provide feedback on walkability
- Submit recommendations

**Permissions:**
| Action | Allowed | Scope |
|--------|---------|-------|
| Create audit | ✅ Yes | Any route |
| View audits | ✅ Yes | Own audits only |
| Edit audit | ✅ Yes | Own audits (<24h after submission) |
| Delete audit | ❌ No | - |
| View reports | ✅ Yes | Own audit reports |
| Download PDF | ✅ Yes | Own audit reports |
| View analytics | ❌ No | - |
| Respond to issues | ❌ No | - |
| Manage users | ❌ No | - |

**Typical User:**
- Volunteer community member
- Mobility assessment participant
- School parent conducting school route audit

---

#### 5.1.2 Coordinator

**Description:** Facilitators who organize and manage multiple audits

**Primary Responsibilities:**
- Organize multi-participant audits
- Invite and manage auditors
- Review and compile audit results
- Communicate with local authorities
- Generate reports for stakeholders

**Permissions:**
| Action | Allowed | Scope |
|--------|---------|-------|
| Create audit | ✅ Yes | Any route |
| View audits | ✅ Yes | All audits in their organization |
| Edit audit | ✅ Yes | Own audits + invited participant audits (<24h) |
| Delete audit | ✅ Yes | Own audits only |
| View reports | ✅ Yes | Organization audits |
| Download PDF | ✅ Yes | Organization audits |
| Email reports | ✅ Yes | Organization audits |
| View analytics | ✅ Yes | Organization-level dashboard |
| Respond to issues | ❌ No | - |
| Invite participants | ✅ Yes | To their audits |
| Manage users | ✅ Yes | Auditors in their organization |

**Typical User:**
- Community development officer
- Mobility coordinator
- School travel officer
- Volunteer group leader

---

#### 5.1.3 LA Admin (Local Authority Administrator)

**Description:** Local authority officers who review audits and track improvements

**Primary Responsibilities:**
- Review all audits in their county
- Respond to issues and recommendations
- Track implementation status
- Generate reports for council meetings
- Analyze trends across multiple audits

**Permissions:**
| Action | Allowed | Scope |
|--------|---------|-------|
| Create audit | ✅ Yes | Any route in their county |
| View audits | ✅ Yes | All audits in their county |
| Edit audit | ✅ Yes | Own audits (<24h) |
| Delete audit | ✅ Yes | Audits in their county |
| View reports | ✅ Yes | County-level |
| Download PDF | ✅ Yes | All county audits |
| Email reports | ✅ Yes | All county audits |
| View analytics | ✅ Yes | County-level dashboard |
| Respond to issues | ✅ Yes | Issues in their county |
| Update implementation status | ✅ Yes | Issues/recommendations in their county |
| Manage users | ✅ Yes | Users in their county |
| Export GIS data | ✅ Yes | County data |

**Typical User:**
- County/city engineer
- Transport planner
- Active travel officer
- Accessibility officer

---

#### 5.1.4 System Admin

**Description:** Technical administrators who manage the entire system

**Primary Responsibilities:**
- Manage all users and permissions
- Configure system settings
- Monitor system health
- Perform backups
- Manage integrations
- Support other users

**Permissions:**
| Action | Allowed | Scope |
|--------|---------|-------|
| **ALL ACTIONS** | ✅ Yes | System-wide |
| View system logs | ✅ Yes | All logs |
| Manage organizations | ✅ Yes | Create/edit/delete |
| Configure integrations | ✅ Yes | API keys, webhooks |
| Access admin panel | ✅ Yes | Full access |
| Database access | ✅ Yes | Read/write (with caution) |

**Typical User:**
- IT administrator
- DevOps engineer
- System integrator

---

### 5.2 Permission Matrix

| Feature | Auditor | Coordinator | LA Admin | System Admin |
|---------|---------|-------------|----------|--------------|
| **Audits** |
| Create audit | ✅ | ✅ | ✅ | ✅ |
| View own audits | ✅ | ✅ | ✅ | ✅ |
| View organization audits | ❌ | ✅ | ❌ | ✅ |
| View county audits | ❌ | ❌ | ✅ | ✅ |
| View all audits | ❌ | ❌ | ❌ | ✅ |
| Edit own audits (<24h) | ✅ | ✅ | ✅ | ✅ |
| Edit organization audits | ❌ | ✅ | ❌ | ✅ |
| Delete own audits | ❌ | ✅ | ❌ | ✅ |
| Delete county audits | ❌ | ❌ | ✅ | ✅ |
| **Issues & Recommendations** |
| Log issues | ✅ | ✅ | ✅ | ✅ |
| View issues | ✅ Own | ✅ Org | ✅ County | ✅ All |
| Respond to issues | ❌ | ❌ | ✅ | ✅ |
| Update issue status | ❌ | ❌ | ✅ | ✅ |
| Add recommendations | ✅ | ✅ | ✅ | ✅ |
| Respond to recommendations | ❌ | ❌ | ✅ | ✅ |
| **Reports & Analytics** |
| Generate PDF | ✅ Own | ✅ Org | ✅ County | ✅ All |
| Download PDF | ✅ Own | ✅ Org | ✅ County | ✅ All |
| Email report | ❌ | ✅ | ✅ | ✅ |
| View analytics dashboard | ❌ | ✅ Org | ✅ County | ✅ All |
| Export GIS data | ❌ | ❌ | ✅ | ✅ |
| **User Management** |
| Invite users | ❌ | ✅ Org | ✅ County | ✅ All |
| Manage users | ❌ | ✅ Org | ✅ County | ✅ All |
| Assign roles | ❌ | ❌ | ✅ | ✅ |
| Delete users | ❌ | ❌ | ❌ | ✅ |
| **System** |
| Configure settings | ❌ | ❌ | ❌ | ✅ |
| View system logs | ❌ | ❌ | ❌ | ✅ |
| Manage integrations | ❌ | ❌ | ❌ | ✅ |

---

## 6. Success Metrics

### 6.1 Product Metrics

#### Adoption Metrics

| Metric | 3 Months | 6 Months | 12 Months | Measurement |
|--------|----------|----------|-----------|-------------|
| **Registered Users** | 25+ | 50+ | 150+ | Database count |
| **Active Users (MAU)** | 15+ | 35+ | 100+ | Monthly logins |
| **Organizations** | 3+ | 10+ | 20+ | Unique organizations |
| **Audits Completed** | 30+ | 100+ | 500+ | Completed status |
| **Routes Created** | 20+ | 75+ | 300+ | Unique routes |

#### Engagement Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Audit Completion Rate** | 80%+ | (Completed / Started) × 100 |
| **Photos per Audit** | 10+ average | Total photos / Total audits |
| **Issues per Audit** | 8+ average | Total issues / Total audits |
| **Recommendations per Audit** | 3+ average | Total recommendations / Total audits |
| **Repeat Auditors** | 40%+ | Users with 2+ audits |
| **Offline Audits** | 20%+ | Audits started offline |

#### Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Complete Audits** | 95%+ | All 6+ sections scored |
| **GPS-Tagged Issues** | 98%+ | Issues with valid coordinates |
| **Photos with GPS** | 90%+ | Photos with EXIF GPS data |
| **User Satisfaction** | 90%+ | Post-audit survey (1-5 scale) |
| **Net Promoter Score** | 50+ | NPS survey |

### 6.2 Technical Metrics

#### Performance Metrics

| Metric | Target | Tool | Alert Threshold |
|--------|--------|------|-----------------|
| **Uptime** | 99.5%+ | UptimeRobot | <99% in any week |
| **Page Load Time (p95)** | <3s | Lighthouse | >5s |
| **API Response Time (p95)** | <500ms | Server logs | >1000ms |
| **Photo Upload Time** | <5s | Client telemetry | >10s |
| **PDF Generation Time** | <30s | Server logs | >60s |
| **Database Query Time (p95)** | <100ms | PostgreSQL logs | >500ms |

#### Reliability Metrics

| Metric | Target | Tool | Alert Threshold |
|--------|--------|------|-----------------|
| **Error Rate** | <1% | Sentry | >5% |
| **Offline Sync Success** | 95%+ | Client telemetry | <90% |
| **Photo Upload Success** | 98%+ | Server logs | <95% |
| **PDF Generation Success** | 99%+ | Server logs | <98% |
| **Background Job Success** | 98%+ | Bull dashboard | <95% |

#### Infrastructure Metrics

| Metric | Target | Tool | Alert Threshold |
|--------|--------|------|-----------------|
| **CPU Usage** | <70% | Railway/Render | >85% |
| **Memory Usage** | <80% | Railway/Render | >90% |
| **Database Connections** | <70 of 100 | PostgreSQL | >85 |
| **Storage Usage** | <80% | Firebase Console | >90% |
| **Redis Memory** | <1.5GB of 2GB | Redis CLI | >1.8GB |

### 6.3 Business Impact Metrics

#### Efficiency Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| **Audit Completion Time** | 2.5 hours | 45 minutes | Average time from start to PDF |
| **Time to Report** | 2+ hours | <1 hour | Submission to PDF generation |
| **Manual Data Entry** | 2 hours | 0 minutes | Eliminated |
| **Staff Time per Audit** | 3 hours | 30 minutes | Coordinator + LA review time |

#### Cost Savings

| Item | Annual Cost (Paper) | Annual Cost (Digital) | Savings |
|------|--------------------|-----------------------|---------|
| **Staff Time** (500 audits) | €50,000 | €15,000 | €35,000 |
| **Printing & Materials** | €2,500 | €0 | €2,500 |
| **Data Entry** | €15,000 | €0 | €15,000 |
| **Software/Infrastructure** | €0 | €8,000 | -€8,000 |
| **Total** | €67,500 | €23,000 | **€44,500** |

#### Quality Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Data Completeness** | 75% | 95% | +20% |
| **GPS Accuracy** | 0% (manual entry) | 98% | +98% |
| **Photo Documentation** | 40% of audits | 90% of audits | +50% |
| **LA Response Rate** | 30% | 70% | +40% |
| **Implementation Rate** | 20% | 50% | +30% |

### 6.4 User Satisfaction Metrics

#### NPS Survey (Quarterly)

**Question:** "How likely are you to recommend the Walking Audit App to a colleague?" (0-10 scale)

**Target:** NPS Score 50+

**Categories:**
- **Promoters (9-10):** 60%+
- **Passives (7-8):** 30%
- **Detractors (0-6):** <10%

#### Post-Audit Satisfaction Survey

**Questions (1-5 scale):**
1. How easy was it to complete the audit? (Target: 4.5+)
2. How satisfied are you with the offline functionality? (Target: 4.0+)
3. How useful was the photo capture feature? (Target: 4.5+)
4. How satisfied are you with the generated report? (Target: 4.2+)
5. Overall satisfaction with the app? (Target: 4.5+)

**Target:** 90%+ respondents rate 4+ on all questions

---

## 7. Project Timeline

### 7.1 Phase 1: MVP (Months 1-3)

#### Month 1: Foundation

**Week 1-2: Project Setup**
- ✅ Development environment setup
- ✅ Git repository initialization
- ✅ CI/CD pipeline configuration
- ✅ Database schema design
- ✅ API endpoint specification
- ✅ UI/UX wireframes

**Week 3-4: Core Infrastructure**
- 🔨 Authentication system (JWT)
- 🔨 Database setup (PostgreSQL + PostGIS)
- 🔨 API framework (Express + routes)
- 🔨 Frontend framework (Next.js setup)
- 🔨 Basic UI components library

**Deliverables:**
- ✅ Development environment
- ✅ Authentication working
- ✅ Database schema deployed
- ✅ Basic CRUD APIs

---

#### Month 2: Core Features

**Week 5-6: Route Management**
- 🔨 Google Maps integration
- 🔨 Route drawing tool
- 🔨 Route CRUD operations
- 🔨 Route listing & selection

**Week 7-8: Audit Form**
- 🔨 AuditWizard component
- 🔨 All 7 section forms
- 🔨 Participant form
- 🔨 Form validation (Zod)
- 🔨 Progress tracking

**Deliverables:**
- ✅ Users can draw routes
- ✅ Users can complete all 7 sections
- ✅ Data saves to database

---

#### Month 3: Advanced Features

**Week 9-10: Photos & Issues**
- 🔨 Camera integration
- 🔨 Photo capture + GPS
- 🔨 Issue logging
- 🔨 Photo upload to cloud
- 🔨 Issue map visualization

**Week 11: Offline Support**
- 🔨 Service Worker setup
- 🔨 IndexedDB integration
- 🔨 Background sync
- 🔨 Offline queue management

**Week 12: Reports & Polish**
- 🔨 PDF generation (Puppeteer)
- 🔨 Radar chart visualization
- 🔨 Email integration
- 🔨 Bug fixes & testing
- 🔨 Production deployment

**Deliverables:**
- ✅ Complete MVP
- ✅ 10 pilot audits completed
- ✅ Production-ready

---

### 7.2 Phase 2: Enhanced Features (Months 4-6)

#### Month 4: Analytics & Dashboard

- 📊 Analytics dashboard (coordinator view)
- 📊 County-level dashboard (LA view)
- 📊 Trend analysis
- 📊 Comparative benchmarking
- 📊 Data export (CSV, GIS)

#### Month 5: Enhanced Audit Features

- ⭐ Enhanced audit questions
- ⭐ Gradient/slope calculation
- ⭐ Public transport proximity
- ⭐ Permeability scoring
- ⭐ Before/after comparison

#### Month 6: LA Workflow

- ⭐ Issue response system
- ⭐ Recommendation tracking
- ⭐ Implementation status
- ⭐ Email notifications
- ⭐ User onboarding flow

**Deliverables:**
- ✅ 100+ audits completed
- ✅ 5+ LAs onboarded
- ✅ Analytics dashboard live

---

### 7.3 Phase 3: Advanced Analytics (Months 7-12)

See Phase 3 features in [Section 2.3](#23-feature-roadmap)

---

## 8. Appendices

### Appendix A: Glossary

| Term | Definition |
|------|------------|
| **NTA** | National Transport Authority - Irish government transport authority |
| **LA** | Local Authority - County or city council in Ireland |
| **PWA** | Progressive Web App - Web app with native-like features |
| **PostGIS** | Spatial database extension for PostgreSQL |
| **GeoJSON** | JSON format for encoding geographic data structures |
| **EXIF** | Exchangeable Image File Format - metadata stored in photos |
| **GPS** | Global Positioning System - satellite-based location system |
| **JWT** | JSON Web Token - compact token format for authentication |
| **CRUD** | Create, Read, Update, Delete - basic data operations |
| **API** | Application Programming Interface - software intermediary |
| **REST** | Representational State Transfer - API architectural style |
| **GDPR** | General Data Protection Regulation - EU privacy law |
| **TLS** | Transport Layer Security - encryption protocol |
| **CDN** | Content Delivery Network - distributed file delivery |
| **ORM** | Object-Relational Mapping - database abstraction layer |

### Appendix B: Acronyms

| Acronym | Full Form |
|---------|-----------|
| **MAU** | Monthly Active Users |
| **DAU** | Daily Active Users |
| **NPS** | Net Promoter Score |
| **KPI** | Key Performance Indicator |
| **SLA** | Service Level Agreement |
| **RTO** | Recovery Time Objective |
| **RPO** | Recovery Point Objective |
| **WAF** | Web Application Firewall |
| **DDoS** | Distributed Denial of Service |
| **XSS** | Cross-Site Scripting |
| **CSRF** | Cross-Site Request Forgery |
| **SQL** | Structured Query Language |
| **NoSQL** | Not Only SQL |

### Appendix C: External References

**Irish Transport & Planning:**
1. National Transport Authority - https://www.nationaltransport.ie/
2. Sustainable Transport Division - https://www.gov.ie/en/policy-information/sustainable-transport/
3. Design Manual for Urban Roads and Streets - https://www.gov.ie/en/publication/4c0bd-design-manual-for-urban-roads-and-streets/

**Walkability Research:**
4. Healthy Streets Indicators - https://www.healthystreets.com/
5. Walk21 International Charter for Walking - https://www.walk21.com/
6. National Disability Authority - Universal Design - https://universaldesign.ie/

**Technical Documentation:**
7. Google Maps Platform - https://developers.google.com/maps
8. PostGIS Documentation - https://postgis.net/documentation/
9. Next.js Documentation - https://nextjs.org/docs
10. Prisma Documentation - https://www.prisma.io/docs

### Appendix D: Contact Information

**Project Team:**
- **Product Manager:** [Name] - [email]
- **Lead Engineer:** [Name] - [email]
- **UX Designer:** [Name] - [email]
- **QA Lead:** [Name] - [email]

**Stakeholders:**
- **NTA Representative:** [Name] - [email]
- **Local Authority Liaison:** [Name] - [email]
- **Community Groups Coordinator:** [Name] - [email]

**Support:**
- **Technical Support:** support@walkingaudit.ie
- **General Inquiries:** info@walkingaudit.ie
- **Bug Reports:** bugs@walkingaudit.ie

---

## Document Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2025-01-05 | Product Team | Initial draft |
| 0.5 | 2025-01-08 | Engineering Team | Technical specifications added |
| 1.0 | 2025-01-11 | Full Team | Complete PRD ready for development |

---

## Approval Signatures

- [ ] **Product Manager** - Approved on: ____________
- [ ] **Lead Engineer** - Approved on: ____________
- [ ] **CTO** - Approved on: ____________
- [ ] **Project Sponsor (NTA)** - Approved on: ____________

---

**Next Document:** [📋 Database Complete](./02-Database-Complete.md)

---

*This document is part of the Walking Audit App technical specification suite. For questions or clarifications, contact the product team.*
