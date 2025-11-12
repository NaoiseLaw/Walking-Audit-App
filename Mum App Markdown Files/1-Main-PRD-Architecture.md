# Walking Audit Web Application
# Technical Product Requirements Document
# Part 1: Main PRD & System Architecture

**Version:** 1.0  
**Last Updated:** January 2025  
**Document Owner:** Product & Engineering  
**Status:** Development Ready

---

## Document Overview

This is **Part 1 of 6** in the complete Walking Audit App technical documentation:

1. **Main PRD & Architecture** ← You are here
2. Database Complete Specification
3. API Complete Specification
4. Frontend Complete Implementation
5. Backend Services Implementation
6. Testing & DevOps

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Strategy](#2-product-vision--strategy)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Component Architecture](#5-component-architecture)
6. [Data Flow & Integration](#6-data-flow--integration)
7. [Security Architecture](#7-security-architecture)
8. [Performance Architecture](#8-performance-architecture)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Development Roadmap](#10-development-roadmap)

---

## 1. Executive Summary

### 1.1 Product Purpose

The Walking Audit Web Application digitizes the Irish National Transport Authority's Universal Design Walkability Audit Tool, transforming a paper-based process into an efficient, data-driven digital platform. This application enables community groups, local authorities, and coordinators to conduct comprehensive walking infrastructure assessments with real-time data collection, GPS-tagged issue tracking, and automated report generation.

### 1.2 The Problem We're Solving

#### Current State (Paper-Based Audits)
- **Time Consuming:** 2+ hours from audit completion to final report
- **Data Loss:** No GPS coordinates for issues, making follow-up difficult
- **Inconsistent:** Different people interpret and record differently
- **Isolated:** No central repository for comparison or trend analysis
- **Inefficient:** Manual transcription introduces errors and delays
- **Limited Analysis:** Difficult to aggregate data across multiple audits
- **Poor Accessibility:** Paper forms not accessible for all participants

#### Impact on Stakeholders
- **Local Authorities:** Cannot prioritize improvements effectively without aggregated data
- **Community Groups:** Frustrated by slow feedback and lack of visible action
- **Urban Planners:** Missing crucial data for evidence-based decision making
- **Researchers:** Cannot conduct longitudinal studies or comparative analysis

### 1.3 Our Solution

A **Progressive Web Application** that:

#### Core Capabilities
1. **Mobile-First Digital Forms**
   - 7-section structured audit (NTA methodology)
   - Conditional logic and smart validation
   - Multi-language support (English, Irish)
   - Offline-first architecture

2. **Spatial Data Collection**
   - GPS-tagged issue pins on interactive maps
   - Photo capture with automatic location embedding
   - Route drawing with snap-to-roads
   - Elevation profile calculation

3. **Intelligent Reporting**
   - Auto-generated PDF reports (<30 seconds)
   - Radar chart visualizations (Healthy Streets style)
   - Priority-ranked recommendations
   - Before/after comparison tools

4. **Centralized Data Platform**
   - County-level analytics dashboards
   - Heatmap visualizations of problem areas
   - Trend analysis over time
   - Export capabilities for GIS systems

#### Measurable Impact
- **⏱️ 60% Time Reduction:** From 2+ hours to 45 minutes
- **📍 100% Location Accuracy:** GPS coordinates for every issue
- **📊 Actionable Insights:** Priority-ranked recommendations
- **🔄 Real-Time Sync:** Instant data availability for decision makers
- **♿ Universal Design:** Accessible to all user abilities

### 1.4 Success Criteria

#### Phase 1 (Months 1-6)
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Active Users | 50+ registered users | Database query |
| Audits Completed | 100+ audits | Dashboard analytics |
| Organizations | 10+ councils/groups | User org field |
| User Satisfaction | 90%+ satisfaction | Post-audit survey |
| System Uptime | 99%+ availability | UptimeRobot |
| Data Quality | <5% validation errors | Error logs |

#### Phase 2 (Months 7-12)
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Active Users | 200+ registered users | Database query |
| Audits Completed | 500+ audits | Dashboard analytics |
| Organizations | 25+ councils/groups | User org field |
| LA Engagement | 80%+ LA response rate | Recommendation responses |
| Mobile Usage | 70%+ mobile audits | Device analytics |
| Offline Success | 95%+ offline syncs | Sync queue logs |

#### Technical KPIs (Ongoing)
| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| API Response Time (p95) | <500ms | <1000ms |
| Page Load Time (FCP) | <1.5s | <3s |
| Photo Upload Success | >95% | >90% |
| PDF Generation Time | <30s | <60s |
| Offline Sync Success | >95% | >90% |
| Database Query Time (p95) | <50ms | <200ms |

### 1.5 Target Users & Personas

#### Persona 1: Sarah - Community Auditor
**Demographics:**
- Age: 32
- Role: Parent & community volunteer
- Location: Suburban Dublin
- Tech comfort: Medium

**Goals:**
- Quickly record observations during school drop-off walk
- Ensure wheelchair-accessible routes for elderly mother
- See issues get fixed in her neighborhood

**Pain Points:**
- Limited time - needs to complete audit during walk
- Poor mobile signal in some areas
- Difficulty describing exact locations in writing

**How App Helps:**
- Offline mode works without signal
- GPS pins exact locations automatically
- Photo capture eliminates lengthy descriptions
- Completes audit in 30 minutes during regular walk

#### Persona 2: Michael - Audit Coordinator
**Demographics:**
- Age: 45
- Role: Active travel coordinator for NGO
- Location: Cork City
- Tech comfort: High

**Goals:**
- Organize 20+ audits per year
- Compile professional reports for council meetings
- Track which recommendations get implemented
- Demonstrate impact to funders

**Pain Points:**
- Manually compiling data from 10+ volunteers
- Creating professional visualizations takes hours
- Following up on recommendations is manual process
- Hard to show year-over-year improvements

**How App Helps:**
- Centralized dashboard shows all audits
- Auto-generated PDF reports with charts
- Track LA responses to recommendations
- Export data for grant applications

#### Persona 3: Emma - Local Authority Officer
**Demographics:**
- Age: 38
- Role: Senior Engineer, Roads & Transportation
- Location: Galway County Council
- Tech comfort: Medium-High

**Goals:**
- Prioritize infrastructure improvements with limited budget
- Respond to community concerns with evidence
- Report to elected officials on progress
- Meet legal obligations under Disability Act

**Pain Points:**
- Receives feedback through multiple channels (email, letters, meetings)
- Difficult to prioritize without objective data
- Cannot track if improvements actually helped
- Hard to justify budget allocations to finance

**How App Helps:**
- All community feedback in one platform
- Issues prioritized by severity and frequency
- Before/after audits show impact of works
- Analytics dashboard for council presentations

#### Persona 4: James - System Administrator
**Demographics:**
- Age: 29
- Role: IT Manager for consortium of councils
- Location: Remote (works for multiple councils)
- Tech comfort: Expert

**Goals:**
- Ensure system reliability and data security
- Manage user access across organizations
- Export data for GIS integration
- Maintain GDPR compliance

**Pain Points:**
- Multiple systems to manage
- Manual user provisioning
- Data scattered across platforms
- Security audit requirements

**How App Helps:**
- Role-based access control
- Automated user management
- Single data platform
- Built-in GDPR compliance tools

### 1.6 Market Context

#### Irish Walking Infrastructure Context
- **Legal Mandate:** Disability Act 2005 requires accessible public infrastructure
- **Policy Push:** National Transport Authority promoting active travel
- **Funding Available:** €360M Active Travel Investment Programme (2024-2025)
- **Climate Goals:** Transport sector must reduce emissions 50% by 2030
- **Health Crisis:** 60% of Irish adults overweight/obese; walkability is key intervention

#### Current Audit Landscape in Ireland
- **Volume:** ~200-300 walking audits conducted annually (estimated)
- **Methods:** Primarily paper-based using NTA template
- **Organizations:** Mix of local authorities, NGOs, community groups
- **Data Loss:** Estimated 40% of audit data never used due to manual barriers
- **Consistency:** Wide variation in interpretation and recording

#### Competitive Analysis

| Solution | Type | Strengths | Weaknesses |
|----------|------|-----------|------------|
| **Paper Forms (NTA)** | Traditional | Free, familiar, works everywhere | Time-consuming, no spatial data, hard to analyze |
| **Google Forms** | Generic | Easy setup, free | No offline, no GPS, poor mobile UX |
| **Survey123 (Esri)** | GIS Platform | Powerful mapping, offline | Expensive (€1500+/yr), steep learning curve |
| **Fulcrum** | Field Data | Good mobile app, offline | US-focused, €500+/yr per user, over-featured |
| **Custom Solutions** | Bespoke | Tailored to org | Very expensive (€50k+), no support |
| **Our Solution** | Purpose-Built | Designed for Irish audits, affordable, accessible | New platform (perceived risk) |

#### Our Competitive Advantages
1. **Purpose-Built:** Exactly matches NTA methodology (no adaptation needed)
2. **Accessible Pricing:** Freemium model for community groups
3. **Irish Context:** Irish language support, Irish local authorities pre-configured
4. **Offline-First:** Works in rural Ireland with poor connectivity
5. **Open Data:** Supports Ireland's open data initiatives
6. **Community-Driven:** Built with feedback from actual audit coordinators

### 1.7 Business Model

#### Pricing Strategy (Future - Phase 3)
```
Tier 1: Community Free
- Up to 10 audits/year
- 2 users
- Basic reports
- Community support
- PERFECT FOR: Small community groups

Tier 2: Organization (€500/year)
- Unlimited audits
- 10 users
- Advanced analytics
- Priority support
- Email support
- PERFECT FOR: NGOs, advocacy groups

Tier 3: Local Authority (€2000/year)
- Unlimited audits
- Unlimited users
- White-label reports
- API access
- Dedicated support
- SLA guarantee
- PERFECT FOR: County councils, city councils

Tier 4: Enterprise (Custom pricing)
- Multi-organization management
- Custom integrations (GIS, etc.)
- On-premise option
- Training included
- PERFECT FOR: Consortiums, national bodies
```

**Note:** Phase 1 MVP will be free for all users to build adoption.

### 1.8 Development Timeline

#### Phase 1: MVP (Months 1-3)
**Goal:** Functional digital audit tool with core features

**Sprint 1-2 (Weeks 1-4):** Foundation
- Project setup (repos, CI/CD, environments)
- Authentication system
- Database schema implementation
- Basic API endpoints (users, routes, audits)

**Sprint 3-4 (Weeks 5-8):** Core Audit Flow
- Audit wizard component
- 7 section forms with validation
- Route drawing on maps
- Photo capture and upload
- Offline storage (IndexedDB)

**Sprint 5-6 (Weeks 9-12):** Reporting & Polish
- PDF report generation
- Radar chart visualization
- Dashboard interface
- Offline sync mechanism
- User testing & bug fixes

**Deliverables:**
- ✅ Working audit creation flow
- ✅ Mobile-responsive interface
- ✅ Offline capability
- ✅ Basic PDF reports
- ✅ 10 beta testers onboarded

#### Phase 2: Enhanced Features (Months 4-6)
**Goal:** Analytics, collaboration, and LA engagement tools

**Sprint 7-8 (Weeks 13-16):** Analytics Dashboard
- County-level analytics views
- Heatmap visualizations
- Issue tracking dashboard
- Before/after comparison tool

**Sprint 9-10 (Weeks 17-20):** LA Response System
- LA portal for issue management
- Recommendation response workflow
- Email notification system
- Export functionality (CSV, GeoJSON)

**Sprint 11-12 (Weeks 21-24):** Polish & Scale
- Performance optimization
- Enhanced offline sync
- Mobile app wrapper (Capacitor)
- Load testing & scaling

**Deliverables:**
- ✅ Full analytics platform
- ✅ LA engagement tools
- ✅ 50+ active users
- ✅ 100+ completed audits

#### Phase 3: Advanced Features (Months 7-12)
**Sprint 13-16:** AI & Automation
- AI-assisted virtual audits (Street View)
- Automated issue detection from photos
- Predictive analytics for prioritization
- Integration with external data (traffic, air quality)

**Sprint 17-20:** Collaboration & Training
- Multi-user real-time collaboration
- Training module with video guides
- Gamification elements
- Public-facing audit results (opt-in)

**Sprint 21-24:** Platform Expansion
- Native mobile apps (iOS/Android)
- API for third-party integrations
- White-label options
- Multi-language expansion

---

## 2. Product Vision & Strategy

### 2.1 Product Vision

**Our Vision Statement:**
> "Make Ireland the world's most walkable country by empowering every community with the tools to assess, advocate for, and achieve accessible walking infrastructure for all."

**What Success Looks Like in 5 Years:**
- Every Irish local authority using the platform
- 10,000+ audits completed nationwide
- Measurable improvement in walkability scores
- Platform adopted in UK and other EU countries
- Open-source community of contributors
- Academic research based on aggregated data

### 2.2 Product Principles

#### 1. Accessibility First
Every feature must be usable by people of all abilities. This means:
- Screen reader compatible
- Keyboard navigation
- High contrast mode
- Large touch targets (min 44x44px)
- Simple language (Plain English / Irish)
- Voice input support

#### 2. Offline First
Rural Ireland has poor connectivity. The app must:
- Work completely offline after first load
- Queue all actions locally
- Sync intelligently when connection returns
- Never lose user data
- Show clear offline/online status

#### 3. Evidence-Based Design
Decisions driven by data, not opinions:
- User research with actual auditors
- Analytics on feature usage
- A/B testing for UX improvements
- Regular user feedback surveys
- Accessibility testing with assistive tech users

#### 4. Open by Default
Embrace open data and open source:
- Open source codebase (MIT license)
- Public API for third-party integrations
- Export data in open formats (GeoJSON, CSV)
- Documentation openly available
- Community contributions welcome

#### 5. Privacy Respecting
User trust is paramount:
- GDPR compliant by design
- Minimal data collection
- Transparent data usage
- User-controlled privacy settings
- Secure by default (HTTPS, encryption)

### 2.3 Strategic Priorities (2025)

#### Priority 1: Adoption in 10+ Local Authorities
**Why:** Local authorities are key decision-makers for infrastructure improvements. Getting them on the platform creates a virtuous cycle where community audits directly influence policy.

**Tactics:**
- Direct outreach to Active Travel Officers
- Free tier for first year
- Training webinars
- Case study with early adopter (Dublin City Council)
- Present at Local Government Management Agency (LGMA) conference

**Success Metrics:**
- 10+ local authorities registered
- 5+ local authorities with >5 audits completed
- 1+ case study published

#### Priority 2: Build Network Effects
**Why:** Platform becomes more valuable as more audits are added, enabling comparison and best practice sharing.

**Tactics:**
- Integrate with existing community networks (Age Friendly Ireland, Irish Wheelchair Association)
- Referral program for coordinators
- Public audit map (with org permission)
- Annual "Most Walkable Town" award based on audit scores
- Social sharing features

**Success Metrics:**
- 100+ completed audits
- 50+ active users
- 20% month-over-month growth
- 30%+ users referred by other users

#### Priority 3: Demonstrate Impact
**Why:** Securing funding and long-term adoption requires proof that audits lead to infrastructure improvements.

**Tactics:**
- Before/after comparison tool
- Track which recommendations get implemented
- Case studies showing improvement
- Academic partnership for research papers
- Media outreach for success stories

**Success Metrics:**
- 10+ recommendations marked as "implemented" by LAs
- 5+ before/after comparison audits
- 1+ published case study
- 1+ media mention

### 2.4 Risk Analysis

#### Risk 1: Low Adoption by Local Authorities
**Likelihood:** Medium | **Impact:** High

**Mitigation:**
- Early partnership with 2-3 "lighthouse" councils
- Free tier to reduce adoption friction
- Proven ROI case study before scaling
- Integration with existing council systems (GIS)

#### Risk 2: Poor Mobile Performance
**Likelihood:** Medium | **Impact:** High

**Mitigation:**
- Mobile-first design from day 1
- Regular testing on budget Android devices
- Aggressive performance budgets
- Offline-first architecture

#### Risk 3: Data Privacy Concerns
**Likelihood:** Low | **Impact:** Critical

**Mitigation:**
- GDPR compliance built-in
- Privacy Impact Assessment completed
- Clear data retention policies
- Option to blur faces in photos
- Transparent privacy policy in plain language

#### Risk 4: User Drop-off During Audit
**Likelihood:** Medium | **Impact:** Medium

**Mitigation:**
- Auto-save every 30 seconds
- Resume from last section
- Progress indicator showing completion %
- Option to save as draft
- Friendly reminders via email

#### Risk 5: Funding for Ongoing Development
**Likelihood:** Medium | **Impact:** High

**Mitigation:**
- Multiple revenue streams (SaaS, grants, partnerships)
- Keep core operating costs low (<€30k/year)
- Apply for EU Digital Europe grants
- Partner with universities for research grants

---

## 3. System Architecture

### 3.1 Architectural Overview

The Walking Audit App follows a **modern 3-tier architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT TIER (PWA)                          │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                    Presentation Layer                       │   │
│  │  • React Components (UI)                                    │   │
│  │  • Redux Store (State Management)                           │   │
│  │  • React Router (Navigation)                                │   │
│  │  • Service Worker (Offline + Caching)                       │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                   Client Services Layer                     │   │
│  │  • API Client (HTTP requests)                               │   │
│  │  • IndexedDB Manager (Local storage)                        │   │
│  │  • Sync Manager (Offline queue)                             │   │
│  │  • Google Maps SDK (Mapping)                                │   │
│  │  • Chart.js (Visualizations)                                │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                  ↕ HTTPS/WSS
┌─────────────────────────────────────────────────────────────────────┐
│                         API TIER (Node.js)                          │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                    API Gateway Layer                        │   │
│  │  • Express Server (HTTP server)                             │   │
│  │  • Authentication Middleware (JWT verification)             │   │
│  │  • Rate Limiting (100 req/min)                              │   │
│  │  • Request Validation (Zod schemas)                         │   │
│  │  • CORS Configuration                                       │   │
│  │  • Error Handling                                           │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                   Business Logic Layer                      │   │
│  │  • Auth Service (Login, register, JWT)                      │   │
│  │  • Audit Service (CRUD operations)                          │   │
│  │  • Route Service (Spatial queries)                          │   │
│  │  • Photo Service (Upload, compression)                      │   │
│  │  • Report Service (PDF generation)                          │   │
│  │  • Sync Service (Offline sync handling)                     │   │
│  │  • Email Service (Notifications)                            │   │
│  │  • Analytics Service (Aggregations)                         │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                   Data Access Layer                         │   │
│  │  • Prisma ORM (Type-safe queries)                           │   │
│  │  • Redis Client (Caching)                                   │   │
│  │  • Firebase SDK (Photo storage)                             │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                  ↕
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA TIER                                   │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐        │
│  │ PostgreSQL   │    │   Redis      │    │  Firebase    │        │
│  │ + PostGIS    │    │   Cache      │    │  Storage     │        │
│  │              │    │              │    │              │        │
│  │ • Audits     │    │ • Sessions   │    │ • Photos     │        │
│  │ • Routes     │    │ • API Cache  │    │ • PDFs       │        │
│  │ • Issues     │    │ • Queue      │    │ • Exports    │        │
│  │ • Users      │    │              │    │              │        │
│  └──────────────┘    └──────────────┘    └──────────────┘        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                  ↕
┌─────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                              │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐        │
│  │ Google Maps  │    │  SendGrid    │    │     EPA      │        │
│  │     API      │    │   (Email)    │    │  Ireland API │        │
│  └──────────────┘    └──────────────┘    └──────────────┘        │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐        │
│  │   Sentry     │    │   PostHog    │    │     Stripe   │        │
│  │ (Monitoring) │    │  (Analytics) │    │   (Billing)  │        │
│  └──────────────┘    └──────────────┘    └──────────────┘        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Architectural Principles

#### 1. Progressive Web App (PWA) First
**Decision:** Build as PWA instead of native mobile apps

**Rationale:**
- ✅ Single codebase for all platforms (web, iOS, Android)
- ✅ No app store approval process
- ✅ Instant updates without user action
- ✅ Lower development cost
- ✅ Works on any device with modern browser
- ⚠️ Slight performance trade-off (acceptable for our use case)

**Implementation:**
- Service Worker for offline functionality
- Web App Manifest for installability
- Responsive design (mobile-first)
- Touch-optimized UI (44px+ targets)
- Works offline after first load

#### 2. Offline-First Architecture
**Decision:** App must work completely offline

**Rationale:**
- 🇮🇪 Rural Ireland has poor/intermittent connectivity
- 🚶 Audits happen while walking (moving between coverage areas)
- 📵 Underground paths, tunnels lack signal
- ⚡ Faster UX (no loading spinners)
- 💾 Data never lost

**Implementation:**
```
User Action → Local Save (IndexedDB) → Background Sync Queue → Server
                     ↓
              Immediate UI Update
              
When online:
  Sync Queue → Batch Upload → Server Processing → Update Local State
```

**Conflict Resolution:**
- Server timestamp wins
- User notified of conflicts
- Option to keep both versions

#### 3. API-First Design
**Decision:** Backend exposes RESTful JSON API

**Rationale:**
- 🔌 Enables future integrations (GIS, mobile apps)
- 📱 Clean separation of concerns
- 🧪 Easier to test
- 📚 Self-documenting (OpenAPI spec)
- 🔄 Can swap frontend without backend changes

**API Principles:**
- RESTful resource naming
- Consistent error responses (RFC 7807)
- Versioned endpoints (/v1/)
- JWT authentication
- Rate limiting per user
- Comprehensive validation

#### 4. Spatial-First Data Model
**Decision:** Use PostGIS for all location data

**Rationale:**
- 📍 Native spatial queries (find audits within 5km)
- 🗺️ Efficient geometry storage
- 📐 Built-in distance calculations
- 🔍 Spatial indexing for performance
- 🌍 Standard GeoJSON export

**Examples:**
```sql
-- Find all issues within 500m of a point
SELECT * FROM issues 
WHERE ST_DWithin(
  location,
  ST_SetSRID(ST_MakePoint(-6.2603, 53.3498), 4326)::geography,
  500
);

-- Get routes intersecting a county boundary
SELECT r.* FROM routes r
JOIN county_boundaries cb ON ST_Intersects(r.geometry, cb.geometry)
WHERE cb.name = 'Dublin';
```

#### 5. Stateless API with JWT
**Decision:** Use JWT tokens instead of server-side sessions

**Rationale:**
- ⚖️ Horizontally scalable (no session store)
- 🔐 Secure (signed tokens)
- 📦 Self-contained (all data in token)
- 🚀 Fast (no database lookup per request)
- 🌐 Works across domains

**Token Structure:**
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "auditor",
  "org": "Dublin City Council",
  "iat": 1642345678,
  "exp": 1642432078
}
```

#### 6. Event-Driven Background Jobs
**Decision:** Use job queues for long-running tasks

**Rationale:**
- ⏱️ PDF generation can take 20-30 seconds
- 📸 Photo processing (compression, thumbnails)
- 📧 Email sending
- 📊 Analytics aggregation
- ❌ Don't block HTTP requests

**Queue System:**
```
HTTP Request → Queue Job → Return 202 Accepted → Job Worker → Complete
                              ↓
                        Job ID for status check
```

### 3.3 Data Flow Diagrams

#### Flow 1: User Creates Audit (Online)

```
┌──────────┐
│  User    │
└────┬─────┘
     │ 1. Fills audit form
     ↓
┌─────────────────┐
│   React App     │
│  (Form State)   │
└────┬────────────┘
     │ 2. Submits
     ↓
┌─────────────────┐
│  Zod Validation │ ──X──> Invalid: Show errors
└────┬────────────┘
     │ 3. Valid ✓
     ↓
┌─────────────────┐
│  POST /audits   │
└────┬────────────┘
     │ 4. HTTP request
     ↓
┌─────────────────┐
│  API Gateway    │
│  (Auth check)   │
└────┬────────────┘
     │ 5. Authenticated ✓
     ↓
┌─────────────────┐
│  Audit Service  │
│  (Business logic)│
└────┬────────────┘
     │ 6. Validate & process
     ↓
┌─────────────────┐
│  Prisma ORM     │
└────┬────────────┘
     │ 7. INSERT INTO audits...
     ↓
┌─────────────────┐
│  PostgreSQL     │
└────┬────────────┘
     │ 8. Returns audit ID
     ↓
┌─────────────────┐
│  Queue Job      │
│  (PDF generate) │
└────┬────────────┘
     │ 9. Async job queued
     ↓
┌─────────────────┐
│  HTTP 201       │
│  { id: "..." }  │
└────┬────────────┘
     │ 10. Response to client
     ↓
┌─────────────────┐
│   React App     │
│ (Success state) │
└────┬────────────┘
     │ 11. Navigate to report
     ↓
┌──────────┐
│  User    │
└──────────┘

Meanwhile (async):
┌─────────────────┐
│  Worker Process │
└────┬────────────┘
     │ 12. Picks up job
     ↓
┌─────────────────┐
│ Report Service  │
│ (Generate PDF)  │
└────┬────────────┘
     │ 13. Fetch data
     ↓
┌─────────────────┐
│  Puppeteer      │
│  (Render HTML)  │
└────┬────────────┘
     │ 14. Generate PDF
     ↓
┌─────────────────┐
│ Firebase Storage│
└────┬────────────┘
     │ 15. Upload PDF
     ↓
┌─────────────────┐
│  PostgreSQL     │
│ (Update URL)    │
└────┬────────────┘
     │ 16. PDF available
     ↓
┌─────────────────┐
│   Notification  │
│  (WebSocket)    │
└────┬────────────┘
     │ 17. Notify user
     ↓
┌──────────┐
│  User    │
└──────────┘
```

#### Flow 2: User Creates Audit (Offline)

```
┌──────────┐
│  User    │
└────┬─────┘
     │ 1. Fills audit form (no internet)
     ↓
┌─────────────────┐
│   React App     │
│  (Form State)   │
└────┬────────────┘
     │ 2. Submits
     ↓
┌─────────────────┐
│ Offline Detector│ ──> Online? NO
└────┬────────────┘
     │ 3. Save locally
     ↓
┌─────────────────┐
│   IndexedDB     │
│  audits_local   │
└────┬────────────┘
     │ 4. Stored locally
     ↓
┌─────────────────┐
│   Sync Queue    │
│  { pending }    │
└────┬────────────┘
     │ 5. Added to queue
     ↓
┌─────────────────┐
│   React App     │
│  Show: "Saved   │
│   offline"      │
└────┬────────────┘
     │
     ↓
┌──────────┐
│  User    │ Continues using app
└──────────┘

Later, when online:
┌─────────────────┐
│ Service Worker  │
└────┬────────────┘
     │ 6. Detects connection
     ↓
┌─────────────────┐
│  Sync Manager   │
└────┬────────────┘
     │ 7. Process queue
     ↓
┌─────────────────┐
│  IndexedDB      │
└────┬────────────┘
     │ 8. Get pending audits
     ↓
┌─────────────────┐
│  Upload Photos  │ (largest items first)
└────┬────────────┘
     │ 9. POST /photos/upload
     ↓
┌─────────────────┐
│  Upload Audit   │
└────┬────────────┘
     │ 10. POST /audits
     ↓
┌─────────────────┐
│  Server         │
└────┬────────────┘
     │ 11. Saves to database
     ↓
┌─────────────────┐
│  Response       │
│  { id: "..." }  │
└────┬────────────┘
     │ 12. Update local record
     ↓
┌─────────────────┐
│  IndexedDB      │
│  (Mark synced)  │
└────┬────────────┘
     │ 13. Clean up
     ↓
┌─────────────────┐
│  Notification   │
│ "Audit synced!" │
└────┬────────────┘
     │
     ↓
┌──────────┐
│  User    │
└──────────┘
```

#### Flow 3: Local Authority Responds to Issue

```
┌──────────────┐
│  LA Admin    │
└────┬─────────┘
     │ 1. Views issue dashboard
     ↓
┌─────────────────┐
│  GET /issues    │
│  ?county=Dublin │
└────┬────────────┘
     │ 2. Fetch issues
     ↓
┌─────────────────┐
│  API Gateway    │
│  (Check: is LA  │
│   admin?)       │
└────┬────────────┘
     │ 3. Authorized ✓
     ↓
┌─────────────────┐
│  Spatial Query  │
│  (PostGIS)      │
└────┬────────────┘
     │ 4. SELECT issues WHERE...
     ↓
┌─────────────────┐
│  PostgreSQL     │
└────┬────────────┘
     │ 5. Returns issues
     ↓
┌─────────────────┐
│   React App     │
│  (Issue list)   │
└────┬────────────┘
     │ 6. LA admin clicks issue
     ↓
┌─────────────────┐
│  Issue Detail   │
│  Modal          │
└────┬────────────┘
     │ 7. Types response
     │    "Will fix in Q2 2025"
     ↓
┌─────────────────┐
│ PATCH /issues/:id│
│ { la_status:    │
│   "in_progress",│
│   la_response:  │
│   "..." }       │
└────┬────────────┘
     │ 8. Submit response
     ↓
┌─────────────────┐
│  Issue Service  │
└────┬────────────┘
     │ 9. Update issue
     ↓
┌─────────────────┐
│  PostgreSQL     │
│  (UPDATE issues)│
└────┬────────────┘
     │ 10. Updated
     ↓
┌─────────────────┐
│  Email Service  │
│  (Trigger)      │
└────┬────────────┘
     │ 11. Queue email
     ↓
┌─────────────────┐
│  Email Queue    │
└────┬────────────┘
     │ 12. Worker picks up
     ↓
┌─────────────────┐
│  SendGrid API   │
└────┬────────────┘
     │ 13. Send email to
     │     audit coordinator
     ↓
┌─────────────────┐
│  Coordinator    │
│  (Notification) │
└─────────────────┘
```

### 3.4 Scalability Architecture

#### Horizontal Scaling Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                     Load Balancer                           │
│                   (Cloudflare / Nginx)                      │
│               Round-robin + Health checks                   │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ↓            ↓            ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ API Instance │ │ API Instance │ │ API Instance │
│      #1      │ │      #2      │ │      #3      │
│ (Stateless)  │ │ (Stateless)  │ │ (Stateless)  │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
                        ↓
              ┌─────────────────┐
              │  Redis Cluster  │
              │   (Shared Cache)│
              └─────────────────┘
                        │
                        ↓
              ┌─────────────────┐
              │   PostgreSQL    │
              │    (Primary)    │
              └────────┬────────┘
                       │
           ┌───────────┼───────────┐
           ↓           ↓           ↓
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ Read     │ │ Read     │ │ Read     │
    │ Replica 1│ │ Replica 2│ │ Replica 3│
    └──────────┘ └──────────┘ └──────────┘
```

**Scaling Rules:**
- **1-100 users:** 1 API instance, 1 database
- **100-500 users:** 2-3 API instances, 1 primary + 1 read replica
- **500-2000 users:** 3-5 API instances, 1 primary + 2 read replicas
- **2000+ users:** 5-10 API instances, database sharding by county

#### Database Scaling Strategy

**Phase 1: Vertical Scaling (Year 1)**
```
Single PostgreSQL instance
├── 4 vCPU
├── 16GB RAM
├── 500GB SSD
└── Can handle ~10,000 audits, 500 concurrent users
```

**Phase 2: Read Replicas (Year 2)**
```
Primary (writes) + 2 Read Replicas (reads)
├── Analytics queries → Read replica
├── Report generation → Read replica
├── Dashboard queries → Read replica
└── Audit creation → Primary
```

**Phase 3: Partitioning (Year 3+)**
```sql
-- Partition audits by year
CREATE TABLE audits_2025 PARTITION OF audits
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE audits_2026 PARTITION OF audits
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- Partition audit_log by month
CREATE TABLE audit_log_2025_01 PARTITION OF audit_log
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

**Phase 4: Sharding (If needed)**
```
Shard by county:
├── Shard 1: Dublin, Wicklow, Kildare
├── Shard 2: Cork, Kerry, Waterford
├── Shard 3: Galway, Mayo, Roscommon
└── Shard 4: All other counties
```

### 3.5 Monitoring & Observability

#### Monitoring Stack

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │   Sentry   │  │  LogRocket │  │  PostHog   │           │
│  │  (Errors)  │  │  (Session  │  │ (Analytics)│           │
│  │            │  │   replay)  │  │            │           │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘           │
│        │                │                │                  │
└────────┼────────────────┼────────────────┼──────────────────┘
         │                │                │
         ↓                ↓                ↓
┌─────────────────────────────────────────────────────────────┐
│                    Aggregation Layer                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Grafana Dashboard                        │  │
│  │  • API response times                                 │  │
│  │  • Error rates by endpoint                            │  │
│  │  • Database query performance                         │  │
│  │  • User session metrics                               │  │
│  │  • Photo upload success rate                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│                      Alerting Layer                          │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │   Email    │  │   Slack    │  │ PagerDuty  │           │
│  │  (Critical)│  │   (All)    │  │ (On-call)  │           │
│  └────────────┘  └────────────┘  └────────────┘           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### Key Metrics to Monitor

**Application Metrics:**
```typescript
// Examples of custom metrics we'll track
metrics.increment('audit.created');
metrics.increment('audit.created.offline');
metrics.timing('photo.upload.duration', duration);
metrics.gauge('sync_queue.pending', queueSize);
metrics.increment('pdf.generation.failed');
```

**Infrastructure Metrics:**
- CPU usage per instance
- Memory usage per instance
- Network I/O
- Disk usage
- Database connections pool utilization

**Business Metrics:**
- Daily/Weekly/Monthly Active Users
- Audits created per day
- Average audit completion time
- Photos uploaded per audit
- PDF generation success rate
- Issue response rate by local authorities

---

## 4. Technology Stack

### 4.1 Frontend Technology Stack

#### Core Framework
```yaml
framework: Next.js 14
  why: "Server-side rendering, great DX, built-in optimization"
  version: 14.x (App Router)
  
react: React 18
  why: "Industry standard, huge ecosystem, great tooling"
  version: 18.2+
  features: [Concurrent rendering, Suspense, Server Components]

typescript: TypeScript 5
  why: "Type safety, better IDE support, fewer runtime errors"
  version: 5.x
  strict: true
```

#### State Management
```yaml
redux_toolkit: Redux Toolkit
  why: "Predictable state, dev tools, middleware support"
  version: 2.x
  middleware: [redux-logger, redux-persist]
  
rtk_query: RTK Query
  why: "Data fetching, caching, automatic re-fetching"
  version: 2.x (included in Redux Toolkit)
  features: [Automatic caching, Optimistic updates, Polling]

zustand: Zustand (for simple local state)
  why: "Lightweight alternative for component-local state"
  version: 4.x
  use_cases: [UI state, form state, temporary data]
```

#### Styling & UI
```yaml
tailwind: Tailwind CSS 3
  why: "Utility-first, fast, consistent design system"
  version: 3.x
  plugins: [forms, typography, aspect-ratio]
  
headlessui: Headless UI
  why: "Accessible components, works with Tailwind"
  version: 1.x
  components: [Dialog, Listbox, Menu, Popover, Tabs]
  
radix_ui: Radix UI (alternative/complement)
  why: "More component options, excellent accessibility"
  version: 1.x
  components: [Accordion, Dropdown, Tooltip, Toast]
  
heroicons: Heroicons
  why: "Tailwind-designed icons, SVG, tree-shakeable"
  version: 2.x
```

#### Forms & Validation
```yaml
react_hook_form: React Hook Form
  why: "Performant, less re-renders, great DX"
  version: 7.x
  
zod: Zod
  why: "TypeScript-first schema validation"
  version: 3.x
  integration: Tight integration with React Hook Form via @hookform/resolvers
```

#### Maps & Visualization
```yaml
google_maps: Google Maps JavaScript API
  why: "Best maps for Ireland, Street View support"
  version: latest
  libraries: [places, drawing, geometry, visualization]
  
chartjs: Chart.js
  why: "Simple, performant, good documentation"
  version: 4.x
  plugins: [react-chartjs-2]
  
leaflet: Leaflet (backup/alternative)
  why: "Open-source alternative if Google costs too high"
  version: 1.9.x
  optional: true
```

#### Offline & PWA
```yaml
workbox: Workbox
  why: "Google's library for Service Worker management"
  version: 7.x
  strategies: [CacheFirst, NetworkFirst, StaleWhileRevalidate]
  
dexie: Dexie.js
  why: "IndexedDB wrapper, easier than raw IndexedDB"
  version: 3.x
  features: [Reactive queries, TypeScript support, Sync]
  
pwa_asset_generator: PWA Asset Generator
  why: "Generate all icon sizes for PWA"
  version: 6.x
```

#### Photo & Media
```yaml
browser_image_compression: browser-image-compression
  why: "Client-side image compression before upload"
  version: 2.x
  
exif_js: exif-js
  why: "Extract EXIF data from photos"
  version: 2.x
  
react_webcam: react-webcam
  why: "Camera access in React"
  version: 7.x
```

#### Testing
```yaml
jest: Jest
  why: "Standard testing framework"
  version: 29.x
  
react_testing_library: React Testing Library
  why: "Test React components the way users use them"
  version: 14.x
  
playwright: Playwright
  why: "E2E testing, cross-browser"
  version: 1.40.x
  browsers: [chromium, firefox, webkit]
```

### 4.2 Backend Technology Stack

#### Runtime & Framework
```yaml
node: Node.js
  why: "JavaScript everywhere, huge ecosystem"
  version: 20 LTS
  
express: Express.js
  why: "Mature, flexible, middleware ecosystem"
  version: 4.x
  middleware: [cors, helmet, compression, morgan]
  
typescript: TypeScript
  why: "Type safety on backend too"
  version: 5.x
```

#### Database & ORM
```yaml
postgresql: PostgreSQL
  why: "Robust, ACID compliant, excellent JSON support"
  version: 16.x
  
postgis: PostGIS
  why: "Spatial queries for location data"
  version: 3.4.x
  
prisma: Prisma
  why: "Type-safe ORM, great migrations, auto-generated types"
  version: 5.x
  features: [Migrations, Studio (GUI), Client generation]
```

#### Caching
```yaml
redis: Redis
  why: "Fast in-memory cache, pub/sub for real-time features"
  version: 7.x
  use_cases: [API caching, Session storage, Job queue]
  
ioredis: ioredis (client)
  why: "Better than node-redis, cluster support"
  version: 5.x
```

#### Authentication
```yaml
jsonwebtoken: jsonwebtoken
  why: "JWT creation and verification"
  version: 9.x
  
bcrypt: bcrypt
  why: "Password hashing"
  version: 5.x
  
passport: Passport.js
  why: "Authentication strategies (future: OAuth)"
  version: 0.7.x
  strategies: [passport-local, passport-jwt]
```

#### Validation
```yaml
zod: Zod
  why: "Same schema validation as frontend"
  version: 3.x
  benefits: "Share types between frontend and backend"
```

#### File Handling
```yaml
multer: Multer
  why: "Multipart form data handling (file uploads)"
  version: 1.x
  
sharp: Sharp
  why: "Fast image processing (thumbnails, compression)"
  version: 0.33.x
```

#### PDF Generation
```yaml
puppeteer: Puppeteer
  why: "Headless Chrome for PDF generation"
  version: 21.x
  
pdfkit: PDFKit (alternative)
  why: "Lighter alternative if Puppeteer too heavy"
  version: 0.14.x
  optional: true
```

#### Email
```yaml
nodemailer: Nodemailer
  why: "Email sending"
  version: 6.x
  
sendgrid: @sendgrid/mail
  why: "Reliable email service"
  version: 7.x
```

#### Background Jobs
```yaml
bull: Bull
  why: "Redis-based job queue"
  version: 4.x
  use_cases: [PDF generation, Email sending, Data exports]
  
node_cron: node-cron
  why: "Schedule periodic tasks"
  version: 3.x
  use_cases: [Cleanup old logs, Refresh materialized views]
```

#### Testing
```yaml
jest: Jest
  why: "Same as frontend"
  version: 29.x
  
supertest: Supertest
  why: "HTTP assertion library for API testing"
  version: 6.x
```

### 4.3 Infrastructure & DevOps

#### Hosting
```yaml
frontend:
  platform: Vercel
  plan: Pro ($20/month)
  features:
    - Global CDN
    - Auto SSL
    - Preview deployments
    - Analytics
    - Edge functions
  
backend:
  platform: Railway / Render
  plan: Pro ($20/month)
  features:
    - Auto-scaling
    - Zero-downtime deploys
    - Health checks
    - Log aggregation
    - Metrics

database:
  platform: Railway PostgreSQL / Supabase
  plan: Pro ($25/month)
  specs:
    - 8GB RAM
    - 100GB storage
    - Daily backups
    - Point-in-time recovery

cache:
  platform: Upstash Redis
  plan: Pro ($10/month)
  specs:
    - 2GB memory
    - Persistence enabled
    - Global replication

storage:
  platform: Firebase Storage / AWS S3
  plan: Pay-as-you-go (~$10-50/month)
  specs:
    - CDN delivery
    - Image optimization
    - Lifecycle policies
```

#### Monitoring & Analytics
```yaml
error_tracking:
  service: Sentry
  plan: Team ($26/month)
  features:
    - Error tracking
    - Performance monitoring
    - Release tracking
    - Alerts

analytics:
  service: PostHog
  plan: Scale ($0-450/month)
  features:
    - Product analytics
    - Session recording
    - Feature flags
    - A/B testing
  why: "Privacy-friendly alternative to Google Analytics"

uptime_monitoring:
  service: UptimeRobot
  plan: Pro ($7/month)
  features:
    - 50 monitors
    - 1-minute checks
    - Status pages
    - SMS alerts

logging:
  service: Better Stack (Logtail)
  plan: Startup ($19/month)
  features:
    - Log aggregation
    - Search & filtering
    - Alerting
    - Integrations
```

#### CI/CD
```yaml
ci_cd:
  platform: GitHub Actions
  plan: Free (for public repos)
  workflows:
    - Test on PR
    - Deploy preview on PR
    - Deploy prod on merge to main
    - Nightly database backup
  
code_quality:
  service: CodeClimate
  plan: Free (open source)
  features:
    - Code coverage
    - Maintainability scores
    - Security scans
```

#### External Services
```yaml
google_maps:
  service: Google Maps Platform
  cost: ~$200-500/month (usage-based)
  apis:
    - Maps JavaScript API
    - Places API
    - Geocoding API
    - Directions API
    - Elevation API
    - Roads API

email:
  service: SendGrid
  plan: Essentials ($20/month for 50k emails)
  features:
    - Transactional emails
    - Email validation
    - Analytics
    - Templates

payments:
  service: Stripe
  plan: Pay-per-transaction (2.9% + 30¢)
  features:
    - Subscription management
    - Invoicing
    - Customer portal
  note: Phase 3 feature
```

### 4.4 Development Tools

#### Code Quality
```yaml
eslint: ESLint
  why: "Catch errors, enforce style"
  version: 8.x
  config: airbnb-typescript
  plugins: [react, react-hooks, jsx-a11y]

prettier: Prettier
  why: "Code formatting"
  version: 3.x
  integration: Works with ESLint

husky: Husky
  why: "Git hooks"
  version: 8.x
  hooks: [pre-commit, pre-push]

lint_staged: lint-staged
  why: "Run linters on staged files only"
  version: 15.x
```

#### Documentation
```yaml
typedoc: TypeDoc
  why: "Generate docs from TypeScript comments"
  version: 0.25.x

storybook: Storybook
  why: "Component documentation and testing"
  version: 7.x
  addons: [a11y, actions, controls, docs]
```

### 4.5 Estimated Monthly Costs (Year 1)

```
Infrastructure:
  Vercel (Frontend)         $20
  Railway (Backend)         $20
  Railway (Database)        $25
  Upstash (Redis)          $10
  Firebase (Storage)        $30
  
Services:
  Google Maps API          $200
  SendGrid (Email)          $20
  Sentry (Errors)          $26
  PostHog (Analytics)      $50
  Better Stack (Logs)      $19
  UptimeRobot              $7
  
Domains & SSL:
  Domain (.ie)             $3
  
Total Monthly:            $430
Total Annually:          $5,160
```

**Note:** Costs scale with usage. At 10,000 audits/year, expect ~$8,000-10,000/year.

---

## 5. Component Architecture

### 5.1 Frontend Directory Structure

```
walking-audit-app/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth layout group
│   │   │   ├── layout.tsx
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── forgot-password/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (dashboard)/              # Dashboard layout group
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Dashboard home
│   │   │   │
│   │   │   ├── audits/
│   │   │   │   ├── page.tsx          # Audits list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # Create new audit
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx      # Audit detail
│   │   │   │       ├── edit/
│   │   │   │       │   └── page.tsx  # Edit audit
│   │   │   │       └── report/
│   │   │   │           └── page.tsx  # View report
│   │   │   │
│   │   │   ├── routes/
│   │   │   │   ├── page.tsx          # Routes list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # Create route
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # Route detail
│   │   │   │
│   │   │   ├── issues/
│   │   │   │   ├── page.tsx          # Issues dashboard
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # Issue detail
│   │   │   │
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx          # Analytics dashboard
│   │   │   │
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx          # Settings home
│   │   │   │   ├── profile/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── organization/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── notifications/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   └── admin/                # Admin only
│   │   │       ├── users/
│   │   │       │   └── page.tsx
│   │   │       └── system/
│   │   │           └── page.tsx
│   │   │
│   │   ├── api/                      # API routes (if using Next.js API)
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts
│   │   │   └── webhooks/
│   │   │       └── stripe/
│   │   │           └── route.ts
│   │   │
│   │   ├── layout.tsx                # Root layout
│   │   ├── providers.tsx             # Context providers wrapper
│   │   ├── globals.css               # Global styles
│   │   └── not-found.tsx             # 404 page
│   │
│   ├── components/                   # React components
│   │   │
│   │   ├── audit/                    # Audit-specific components
│   │   │   ├── AuditWizard/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── AuditWizard.types.ts
│   │   │   │   ├── useAuditWizard.ts
│   │   │   │   ├── steps/
│   │   │   │   │   ├── SetupStep.tsx
│   │   │   │   │   ├── ParticipantsStep.tsx
│   │   │   │   │   ├── FootpathsStep.tsx
│   │   │   │   │   ├── FacilitiesStep.tsx
│   │   │   │   │   ├── CrossingStep.tsx
│   │   │   │   │   ├── BehaviourStep.tsx
│   │   │   │   │   ├── SafetyStep.tsx
│   │   │   │   │   ├── LookFeelStep.tsx
│   │   │   │   │   ├── SchoolGatesStep.tsx
│   │   │   │   │   ├── RecommendationsStep.tsx
│   │   │   │   │   └── ReviewStep.tsx
│   │   │   │   └── components/
│   │   │   │       ├── WizardProgress.tsx
│   │   │   │       ├── WizardNavigation.tsx
│   │   │   │       └── StepContainer.tsx
│   │   │   │
│   │   │   ├── AuditCard.tsx
│   │   │   ├── AuditList.tsx
│   │   │   ├── AuditFilters.tsx
│   │   │   ├── AuditStats.tsx
│   │   │   └── sections/
│   │   │       ├── SectionCard.tsx
│   │   │       ├── SectionHeader.tsx
│   │   │       ├── QuestionGroup.tsx
│   │   │       ├── ScoreSelector.tsx
│   │   │       └── ProblemAreaInput.tsx
│   │   │
│   │   ├── map/                      # Map components
│   │   │   ├── WalkingAuditMap/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── useGoogleMaps.ts
│   │   │   │   ├── RouteDrawer.tsx
│   │   │   │   ├── IssueMarker.tsx
│   │   │   │   ├── PhotoMarker.tsx
│   │   │   │   ├── MapLegend.tsx
│   │   │   │   └── MapControls.tsx
│   │   │   ├── RouteMap.tsx
│   │   │   ├── IssueMap.tsx
│   │   │   └── Heatmap.tsx
│   │   │
│   │   ├── report/                   # Report components
│   │   │   ├── RadarChart/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── useRadarChart.ts
│   │   │   │   └── RadarChart.types.ts
│   │   │   ├── ScoreBreakdown.tsx
│   │   │   ├── IssuesList.tsx
│   │   │   ├── RecommendationsList.tsx
│   │   │   ├── PhotoGallery.tsx
│   │   │   └── ReportSummary.tsx
│   │   │
│   │   ├── photo/                    # Photo components
│   │   │   ├── PhotoCapture/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── CameraView.tsx
│   │   │   │   ├── PhotoPreview.tsx
│   │   │   │   └── useCamera.ts
│   │   │   ├── PhotoUpload.tsx
│   │   │   ├── PhotoGrid.tsx
│   │   │   └── PhotoModal.tsx
│   │   │
│   │   ├── issue/                    # Issue components
│   │   │   ├── IssueLogger/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── IssueForm.tsx
│   │   │   │   ├── LocationPicker.tsx
│   │   │   │   └── useIssueLogger.ts
│   │   │   ├── IssueCard.tsx
│   │   │   ├── IssueDashboard.tsx
│   │   │   └── IssueFilters.tsx
│   │   │
│   │   ├── form/                     # Form components
│   │   │   ├── CheckboxGroup.tsx
│   │   │   ├── RadioGroup.tsx
│   │   │   ├── TagInput.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   ├── TimePicker.tsx
│   │   │   └── FormField.tsx
│   │   │
│   │   ├── ui/                       # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   ├── Radio.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Accordion.tsx
│   │   │   └── Avatar.tsx
│   │   │
│   │   └── layout/                   # Layout components
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       ├── Footer.tsx
│   │       ├── Breadcrumbs.tsx
│   │       ├── Container.tsx
│   │       └── PageHeader.tsx
│   │
│   ├── lib/                          # Utilities & services
│   │   │
│   │   ├── api/                      # API client
│   │   │   ├── client.ts             # Base API client
│   │   │   ├── audits.ts             # Audit API
│   │   │   ├── routes.ts             # Route API
│   │   │   ├── issues.ts             # Issue API
│   │   │   ├── photos.ts             # Photo API
│   │   │   ├── reports.ts            # Report API
│   │   │   ├── users.ts              # User API
│   │   │   └── analytics.ts          # Analytics API
│   │   │
│   │   ├── db/                       # IndexedDB
│   │   │   ├── indexeddb.ts          # DB wrapper
│   │   │   ├── schema.ts             # IDB schema
│   │   │   ├── migrations.ts         # IDB migrations
│   │   │   └── queries.ts            # Common queries
│   │   │
│   │   ├── sync/                     # Offline sync
│   │   │   ├── SyncManager.ts        # Main sync logic
│   │   │   ├── QueueManager.ts       # Queue management
│   │   │   ├── ConflictResolver.ts   # Conflict resolution
│   │   │   └── NetworkDetector.ts    # Online/offline detection
│   │   │
│   │   ├── maps/                     # Maps utilities
│   │   │   ├── MapService.ts         # Google Maps wrapper
│   │   │   ├── GeocodingService.ts   # Address → coordinates
│   │   │   ├── RoutingService.ts     # Route optimization
│   │   │   └── ElevationService.ts   # Elevation API
│   │   │
│   │   ├── validation/               # Validation schemas
│   │   │   ├── schemas.ts            # Zod schemas
│   │   │   └── validators.ts         # Custom validators
│   │   │
│   │   ├── auth/                     # Auth utilities
│   │   │   ├── jwt.ts                # JWT handling
│   │   │   ├── permissions.ts        # Permission checks
│   │   │   └── session.ts            # Session management
│   │   │
│   │   └── utils/                    # Generic utilities
│   │       ├── dateUtils.ts
│   │       ├── geoUtils.ts
│   │       ├── formatters.ts
│   │       ├── imageCompression.ts
│   │       ├── exifExtractor.ts
│   │       └── errorHandler.ts
│   │
│   ├── store/                        # Redux store
│   │   ├── index.ts                  # Store config
│   │   ├── slices/
│   │   │   ├── auditSlice.ts
│   │   │   ├── authSlice.ts
│   │   │   ├── mapSlice.ts
│   │   │   ├── uiSlice.ts
│   │   │   └── syncSlice.ts
│   │   └── api/
│   │       ├── baseApi.ts            # RTK Query base
│   │       ├── auditApi.ts
│   │       ├── routeApi.ts
│   │       └── issueApi.ts
│   │
│   ├── hooks/                        # Custom hooks
│   │   ├── useAudit.ts
│   │   ├── useOfflineSync.ts
│   │   ├── useGeolocation.ts
│   │   ├── usePhotoCapture.ts
│   │   ├── useAuth.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useDebounce.ts
│   │   ├── useMediaQuery.ts
│   │   └── useOnlineStatus.ts
│   │
│   ├── types/                        # TypeScript types
│   │   ├── audit.ts
│   │   ├── user.ts
│   │   ├── route.ts
│   │   ├── issue.ts
│   │   ├── photo.ts
│   │   ├── api.ts
│   │   └── common.ts
│   │
│   ├── config/                       # Configuration
│   │   ├── constants.ts
│   │   ├── env.ts                    # Environment variables
│   │   ├── maps.ts                   # Google Maps config
│   │   └── routes.ts                 # App routes config
│   │
│   └── styles/                       # Styles
│       ├── globals.css
│       └── themes/
│           ├── light.css
│           └── dark.css
│
├── public/                           # Static assets
│   ├── manifest.json                 # PWA manifest
│   ├── sw.js                         # Service Worker
│   ├── offline.html                  # Offline fallback
│   ├── icons/
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── favicon.ico
│   └── images/
│
├── tests/                            # Tests
│   ├── unit/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── utils/
│   ├── integration/
│   └── e2e/
│
├── .github/                          # GitHub config
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── .vscode/                          # VS Code config
│   ├── settings.json
│   └── extensions.json
│
├── next.config.js                    # Next.js config
├── tailwind.config.js                # Tailwind config
├── tsconfig.json                     # TypeScript config
├── .eslintrc.json                    # ESLint config
├── .prettierrc                       # Prettier config
├── package.json
└── README.md
```

### 5.2 Component Design Patterns

#### Pattern 1: Container/Presenter Pattern

```typescript
// Container: Handles logic and state
// components/audit/AuditListContainer.tsx
export function AuditListContainer() {
  const { data, isLoading, error } = useGetAuditsQuery();
  const [filters, setFilters] = useState<AuditFilters>({});
  
  const filteredAudits = useMemo(() => {
    return applyFilters(data, filters);
  }, [data, filters]);
  
  return (
    <AuditListPresenter
      audits={filteredAudits}
      isLoading={isLoading}
      error={error}
      filters={filters}
      onFilterChange={setFilters}
    />
  );
}

// Presenter: Pure UI component
// components/audit/AuditListPresenter.tsx
interface AuditListPresenterProps {
  audits: Audit[];
  isLoading: boolean;
  error: Error | null;
  filters: AuditFilters;
  onFilterChange: (filters: AuditFilters) => void;
}

export function AuditListPresenter({
  audits,
  isLoading,
  error,
  filters,
  onFilterChange
}: AuditListPresenterProps) {
  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      <AuditFilters value={filters} onChange={onFilterChange} />
      <div className="grid gap-4">
        {audits.map(audit => (
          <AuditCard key={audit.id} audit={audit} />
        ))}
      </div>
    </div>
  );
}
```

#### Pattern 2: Compound Components Pattern

```typescript
// components/ui/Tabs.tsx
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export function Tabs({ children, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

Tabs.List = function TabsList({ children }: TabsListProps) {
  return <div className="tabs-list">{children}</div>;
};

Tabs.Tab = function Tab({ id, children }: TabProps) {
  const { activeTab, setActiveTab } = useContext(TabsContext)!;
  return (
    <button
      className={cn('tab', activeTab === id && 'tab-active')}
      onClick={() => setActiveTab(id)}
    >
      {children}
    </button>
  );
};

Tabs.Panel = function TabPanel({ id, children }: TabPanelProps) {
  const { activeTab } = useContext(TabsContext)!;
  if (activeTab !== id) return null;
  return <div className="tab-panel">{children}</div>;
};

// Usage
<Tabs defaultTab="overview">
  <Tabs.List>
    <Tabs.Tab id="overview">Overview</Tabs.Tab>
    <Tabs.Tab id="issues">Issues</Tabs.Tab>
    <Tabs.Tab id="photos">Photos</Tabs.Tab>
  </Tabs.List>
  
  <Tabs.Panel id="overview">
    <AuditOverview />
  </Tabs.Panel>
  <Tabs.Panel id="issues">
    <IssuesList />
  </Tabs.Panel>
  <Tabs.Panel id="photos">
    <PhotoGallery />
  </Tabs.Panel>
</Tabs>
```

#### Pattern 3: Custom Hook Pattern

```typescript
// hooks/useOfflineSync.ts
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [pendingCount, setPendingCount] = useState(0);
  
  useEffect(() => {
    // Monitor online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  useEffect(() => {
    // Check pending items
    const checkPending = async () => {
      const count = await syncManager.getPendingCount();
      setPendingCount(count);
    };
    
    checkPending();
    const interval = setInterval(checkPending, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const syncNow = useCallback(async () => {
    if (!isOnline) {
      throw new Error('Cannot sync while offline');
    }
    
    setSyncStatus('syncing');
    try {
      await syncManager.syncAll();
      setSyncStatus('success');
    } catch (error) {
      setSyncStatus('error');
      throw error;
    }
  }, [isOnline]);
  
  return {
    isOnline,
    syncStatus,
    pendingCount,
    syncNow,
    needsSync: pendingCount > 0
  };
}

// Usage in component
function SyncIndicator() {
  const { isOnline, pendingCount, syncNow, needsSync } = useOfflineSync();
  
  return (
    <div className="sync-indicator">
      {!isOnline && (
        <Badge variant="warning">
          📵 Offline {pendingCount > 0 && `(${pendingCount} pending)`}
        </Badge>
      )}
      {isOnline && needsSync && (
        <Button onClick={syncNow} size="sm">
          Sync Now ({pendingCount})
        </Button>
      )}
    </div>
  );
}
```

---

*[Document continues in Part 2: Database Complete Specification]*

---

## Document Control

**Last Updated:** 2025-01-11  
**Next Review:** 2025-02-01

**Version History:**
- v1.0 (2025-01-11): Initial comprehensive draft

**Related Documents:**
- Part 2: Database Complete Specification
- Part 3: API Complete Specification
- Part 4: Frontend Complete Implementation
- Part 5: Backend Services Implementation
- Part 6: Testing & DevOps

---

**END OF PART 1**
