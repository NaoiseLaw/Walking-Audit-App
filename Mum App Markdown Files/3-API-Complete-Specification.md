# Walking Audit Web Application
# Technical Product Requirements Document
# Part 3: API Complete Specification

**Version:** 1.0  
**Last Updated:** January 2025  
**Document Owner:** API Architecture Team  
**Status:** Development Ready

---

## Document Overview

This is **Part 3 of 6** in the complete Walking Audit App technical documentation:

1. Main PRD & Architecture
2. Database Complete Specification
3. **API Complete Specification** ← You are here
4. Frontend Complete Implementation
5. Backend Services Implementation
6. Testing & DevOps

---

## Table of Contents

1. [API Overview](#1-api-overview)
2. [Authentication](#2-authentication)
3. [User Management Endpoints](#3-user-management-endpoints)
4. [Route Endpoints](#4-route-endpoints)
5. [Audit Endpoints](#5-audit-endpoints)
6. [Issue Endpoints](#6-issue-endpoints)
7. [Photo Endpoints](#7-photo-endpoints)
8. [Recommendation Endpoints](#8-recommendation-endpoints)
9. [Report Endpoints](#9-report-endpoints)
10. [Analytics Endpoints](#10-analytics-endpoints)
11. [Error Handling](#11-error-handling)
12. [Rate Limiting](#12-rate-limiting)
13. [Webhooks](#13-webhooks)

---

## 1. API Overview

### 1.1 API Design Principles

```yaml
architecture_style: RESTful
base_url: https://api.walkingaudit.ie/v1
protocol: HTTPS only (TLS 1.3+)
authentication: Bearer JWT tokens
content_type: application/json
charset: UTF-8
versioning: URL path (/v1/, /v2/)
error_format: RFC 7807 Problem Details for HTTP APIs
```

### 1.2 API Standards

#### HTTP Methods
- **GET**: Retrieve resources (idempotent, cacheable)
- **POST**: Create new resources (not idempotent)
- **PUT**: Replace entire resource (idempotent)
- **PATCH**: Partial update (not idempotent)
- **DELETE**: Remove resource (idempotent)

#### Status Codes
- **2xx**: Success
  - `200 OK`: Successful GET, PUT, PATCH, DELETE
  - `201 Created`: Successful POST
  - `202 Accepted`: Async operation accepted
  - `204 No Content`: Successful DELETE (no body)
  
- **3xx**: Redirection
  - `301 Moved Permanently`: Resource moved
  - `304 Not Modified`: Cached version is current
  
- **4xx**: Client Error
  - `400 Bad Request`: Invalid request data
  - `401 Unauthorized`: Missing/invalid authentication
  - `403 Forbidden`: Insufficient permissions
  - `404 Not Found`: Resource doesn't exist
  - `409 Conflict`: Resource conflict
  - `413 Payload Too Large`: File upload too big
  - `422 Unprocessable Entity`: Validation failed
  - `429 Too Many Requests`: Rate limit exceeded
  
- **5xx**: Server Error
  - `500 Internal Server Error`: Unexpected server error
  - `502 Bad Gateway`: Upstream service error
  - `503 Service Unavailable`: Temporary downtime
  - `504 Gateway Timeout`: Upstream timeout

#### Response Headers
```http
Content-Type: application/json; charset=utf-8
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1642345678
X-Response-Time: 142ms
Cache-Control: no-cache, no-store, must-revalidate
```

### 1.3 Common Request Parameters

#### Query Parameters

**Pagination:**
```
?limit=20&offset=0
?page=1&per_page=20
```

**Sorting:**
```
?sort=created_at&order=desc
?sort=-created_at  (minus = descending)
```

**Filtering:**
```
?county=Dublin
?status=completed
?date_from=2025-01-01&date_to=2025-01-31
?search=terenure
```

**Field Selection:**
```
?fields=id,name,created_at
?include=route,participants
```

#### Request Headers
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
Accept: application/json
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
User-Agent: WalkingAuditApp/1.0 (iOS 17.0)
Accept-Language: en-IE
```

### 1.4 Common Response Formats

#### Success Response
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Terenure to Grand Canal",
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

#### List Response with Pagination
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Terenure to Grand Canal"
    }
  ],
  "pagination": {
    "total": 127,
    "count": 20,
    "per_page": 20,
    "current_page": 1,
    "total_pages": 7,
    "has_more": true,
    "links": {
      "first": "https://api.walkingaudit.ie/v1/routes?page=1",
      "last": "https://api.walkingaudit.ie/v1/routes?page=7",
      "prev": null,
      "next": "https://api.walkingaudit.ie/v1/routes?page=2"
    }
  }
}
```

#### Error Response (RFC 7807)
```json
{
  "type": "https://api.walkingaudit.ie/errors/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "One or more validation errors occurred",
  "instance": "/v1/audits",
  "errors": [
    {
      "field": "route_id",
      "message": "Route ID is required",
      "code": "REQUIRED_FIELD"
    },
    {
      "field": "audit_date",
      "message": "Date must be in format YYYY-MM-DD",
      "code": "INVALID_FORMAT"
    }
  ]
}
```

---

## 2. Authentication

### 2.1 POST /auth/register

Register a new user account.

**Request:**
```http
POST /v1/auth/register HTTP/1.1
Host: api.walkingaudit.ie
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "role": "auditor",
  "organization": "Dublin City Council",
  "county": "Dublin"
}
```

**Success Response (201 Created):**
```json
{
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "auditor",
      "organization": "Dublin City Council",
      "county": "Dublin",
      "email_verified": false,
      "created_at": "2025-01-15T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoiYXVkaXRvciIsImlhdCI6MTY0MjM0NTY3OCwiZXhwIjoxNjQyNDMyMDc4fQ.abcdef123456",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 86400
  }
}
```

**Error Responses:**

*400 Bad Request - Invalid Data:*
```json
{
  "type": "https://api.walkingaudit.ie/errors/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "Email already exists",
  "errors": [
    {
      "field": "email",
      "message": "Email already registered",
      "code": "EMAIL_EXISTS"
    }
  ]
}
```

*400 Bad Request - Weak Password:*
```json
{
  "type": "https://api.walkingaudit.ie/errors/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "Password does not meet requirements",
  "errors": [
    {
      "field": "password",
      "message": "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character",
      "code": "WEAK_PASSWORD"
    }
  ]
}
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (!@#$%^&*)

### 2.2 POST /auth/login

Authenticate and get JWT token.

**Request:**
```http
POST /v1/auth/login HTTP/1.1
Host: api.walkingaudit.ie
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Success Response (200 OK):**
```json
{
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "auditor",
      "organization": "Dublin City Council",
      "county": "Dublin",
      "profile_photo_url": "https://storage.walkingaudit.ie/avatars/550e8400.jpg",
      "last_login": "2025-01-15T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 86400
  }
}
```

**Error Responses:**

*401 Unauthorized - Invalid Credentials:*
```json
{
  "type": "https://api.walkingaudit.ie/errors/authentication-error",
  "title": "Authentication Failed",
  "status": 401,
  "detail": "Invalid email or password"
}
```

*403 Forbidden - Account Not Verified:*
```json
{
  "type": "https://api.walkingaudit.ie/errors/account-not-verified",
  "title": "Account Not Verified",
  "status": 403,
  "detail": "Please verify your email address before logging in"
}
```

*429 Too Many Requests - Rate Limited:*
```json
{
  "type": "https://api.walkingaudit.ie/errors/rate-limit-exceeded",
  "title": "Too Many Login Attempts",
  "status": 429,
  "detail": "Too many failed login attempts. Please try again in 15 minutes",
  "retry_after": 900
}
```

### 2.3 POST /auth/refresh

Refresh JWT token using refresh token.

**Request:**
```http
POST /v1/auth/refresh HTTP/1.1
Host: api.walkingaudit.ie
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200 OK):**
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 86400
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "type": "https://api.walkingaudit.ie/errors/invalid-token",
  "title": "Invalid Refresh Token",
  "status": 401,
  "detail": "Refresh token is invalid or expired"
}
```

### 2.4 POST /auth/logout

Invalidate current token.

**Request:**
```http
POST /v1/auth/logout HTTP/1.1
Host: api.walkingaudit.ie
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (204 No Content):**
```http
HTTP/1.1 204 No Content
```

### 2.5 POST /auth/forgot-password

Request password reset email.

**Request:**
```http
POST /v1/auth/forgot-password HTTP/1.1
Host: api.walkingaudit.ie
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Success Response (202 Accepted):**
```json
{
  "data": {
    "message": "If an account exists with this email, you will receive a password reset link"
  }
}
```

**Note:** Always returns 202 even if email doesn't exist (security best practice)

### 2.6 POST /auth/reset-password

Reset password using token from email.

**Request:**
```http
POST /v1/auth/reset-password HTTP/1.1
Host: api.walkingaudit.ie
Content-Type: application/json

{
  "token": "abc123def456",
  "password": "NewSecurePassword123!"
}
```

**Success Response (200 OK):**
```json
{
  "data": {
    "message": "Password reset successful. You can now log in with your new password"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "type": "https://api.walkingaudit.ie/errors/invalid-token",
  "title": "Invalid Reset Token",
  "status": 400,
  "detail": "Reset token is invalid or expired"
}
```

### 2.7 POST /auth/verify-email

Verify email address using token from email.

**Request:**
```http
POST /v1/auth/verify-email HTTP/1.1
Host: api.walkingaudit.ie
Content-Type: application/json

{
  "token": "abc123def456"
}
```

**Success Response (200 OK):**
```json
{
  "data": {
    "message": "Email verified successfully",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "email_verified": true
    }
  }
}
```

### 2.8 POST /auth/resend-verification

Resend verification email.

**Request:**
```http
POST /v1/auth/resend-verification HTTP/1.1
Host: api.walkingaudit.ie
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (202 Accepted):**
```json
{
  "data": {
    "message": "Verification email sent"
  }
}
```

---

## 3. User Management Endpoints

### 3.1 GET /users/me

Get current authenticated user profile.

**Request:**
```http
GET /v1/users/me HTTP/1.1
Host: api.walkingaudit.ie
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "auditor",
    "organization": "Dublin City Council",
    "county": "Dublin",
    "profile_photo_url": "https://storage.walkingaudit.ie/avatars/550e8400.jpg",
    "bio": "Passionate about walkable communities",
    "phone": "+353 1 234 5678",
    "email_verified": true,
    "language": "en",
    "timezone": "Europe/Dublin",
    "notification_preferences": {
      "email": true,
      "push": false,
      "weekly_digest": true
    },
    "audit_count": 23,
    "last_audit_date": "2025-01-10",
    "created_at": "2024-06-15T10:30:00Z",
    "last_login": "2025-01-15T10:30:00Z"
  }
}
```

### 3.2 PATCH /users/me

Update current user profile.

**Request:**
```http
PATCH /v1/users/me HTTP/1.1
Host: api.walkingaudit.ie
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "John Patrick Doe",
  "bio": "Active travel advocate and accessibility champion",
  "phone": "+353 1 234 5678",
  "notification_preferences": {
    "email": true,
    "push": true,
    "weekly_digest": false
  }
}
```

**Success Response (200 OK):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Patrick Doe",
    "bio": "Active travel advocate and accessibility champion",
    "phone": "+353 1 234 5678",
    "notification_preferences": {
      "email": true,
      "push": true,
      "weekly_digest": false
    },
    "updated_at": "2025-01-15T11:00:00Z"
  }
}
```

### 3.3 POST /users/me/photo

Upload profile photo.

**Request:**
```http
POST /v1/users/me/photo HTTP/1.1
Host: api.walkingaudit.ie
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="photo"; filename="profile.jpg"
Content-Type: image/jpeg

[binary data]
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

**Success Response (200 OK):**
```json
{
  "data": {
    "profile_photo_url": "https://storage.walkingaudit.ie/avatars/550e8400.jpg",
    "thumbnail_url": "https://storage.walkingaudit.ie/avatars/550e8400_thumb.jpg"
  }
}
```

**Error Response (413 Payload Too Large):**
```json
{
  "type": "https://api.walkingaudit.ie/errors/file-too-large",
  "title": "File Too Large",
  "status": 413,
  "detail": "Photo must be less than 5MB",
  "max_size_mb": 5
}
```

### 3.4 DELETE /users/me

Delete user account (GDPR).

**Request:**
```http
DELETE /v1/users/me HTTP/1.1
Host: api.walkingaudit.ie
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "password": "SecurePassword123!",
  "reason": "No longer needed"
}
```

**Success Response (202 Accepted):**
```json
{
  "data": {
    "message": "Account deletion scheduled. Your data will be permanently deleted in 30 days",
    "deletion_date": "2025-02-14T10:30:00Z"
  }
}
```

### 3.5 GET /users

List users (admin only).

**Request:**
```http
GET /v1/users?role=auditor&county=Dublin&limit=20&offset=0 HTTP/1.1
Host: api.walkingaudit.ie
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "auditor",
      "organization": "Dublin City Council",
      "county": "Dublin",
      "audit_count": 23,
      "last_audit_date": "2025-01-10",
      "created_at": "2024-06-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 127,
    "count": 20,
    "per_page": 20,
    "current_page": 1,
    "total_pages": 7,
    "has_more": true
  }
}
```

---

## 4. Route Endpoints

### 4.1 GET /routes

List all routes.

**Request:**
```http
GET /v1/routes?county=Dublin&town_city=Terenure&is_public=true&limit=20&offset=0&sort=-created_at HTTP/1.1
Host: api.walkingaudit.ie
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `county` (string): Filter by county
- `town_city` (string): Filter by town/city
- `is_public` (boolean): Filter by public visibility
- `is_featured` (boolean): Filter featured routes
- `search` (string): Search in name/description
- `limit` (integer): Results per page (default: 20, max: 100)
- `offset` (integer): Pagination offset
- `sort` (string): Sort field (prefix with - for desc)

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Terenure to Grand Canal",
      "description": "Main walking route through Rathmines",
      "town_city": "Dublin",
      "county": "Dublin",
      "distance_meters": 2860.5,
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [-6.2582, 53.3169],
          [-6.2570, 53.3180],
          [-6.2547, 53.3223]
        ]
      },
      "route_type": "urban",
      "surface_type": "paved",
      "lighting": "full",
      "avg_gradient_percent": 1.2,
      "has_public_transport": true,
      "tags": ["accessible", "scenic", "school_route"],
      "audit_count": 3,
      "avg_score": 3.2,
      "last_audited": "2025-01-10T14:30:00Z",
      "is_public": true,
      "is_featured": false,
      "created_by": {
        "id": "...",
        "name": "Jane Smith"
      },
      "created_at": "2024-12-01T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "count": 20,
    "per_page": 20,
    "current_page": 1,
    "total_pages": 3,
    "has_more": true
  }
}
```

### 4.2 GET /routes/:id

Get single route by ID.

**Request:**
```http
GET /v1/routes/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: api.walkingaudit.ie
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Terenure to Grand Canal",
    "description": "Main walking route through Rathmines",
    "town_city": "Dublin",
    "county": "Dublin",
    "eircode": "D06 ABC1",
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [-6.2582, 53.3169],
        [-6.2570, 53.3180],
        [-6.2547, 53.3223]
      ]
    },
    "bbox": {
      "type": "Polygon",
      "coordinates": [[
        [-6.2582, 53.3169],
        [-6.2547, 53.3169],
        [-6.2547, 53.3223],
        [-6.2582, 53.3223],
        [-6.2582, 53.3169]
      ]]
    },
    "center_point": {
      "type": "Point",
      "coordinates": [-6.25645, 53.3196]
    },
    "distance_meters": 2860.5,
    "route_type": "urban",
    "surface_type": "paved",
    "lighting": "full",
    "avg_gradient_percent": 1.2,
    "max_gradient_percent": 3.5,
    "min_elevation_meters": 25.0,
    "max_elevation_meters": 35.5,
    "permeability_score": 3,
    "has_public_transport": true,
    "nearest_bus_stop_meters": 150,
    "tags": ["accessible", "scenic", "school_route"],
    "audit_count": 3,
    "avg_score": 3.2,
    "last_audited": "2025-01-10T14:30:00Z",
    "audits": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "audit_date": "2025-01-10",
        "total_score": 15,
        "max_possible_score": 18,
        "walkability_rating": "OK",
        "status": "completed"
      }
    ],
    "is_public": true,
    "is_featured": false,
    "created_by": {
      "id": "...",
      "name": "Jane Smith",
      "organization": "Dublin City Council"
    },
    "created_at": "2024-12-01T10:00:00Z",
    "updated_at": "2025-01-10T14:35:00Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "type": "https://api.walkingaudit.ie/errors/not-found",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Route not found with id: 550e8400-e29b-41d4-a716-446655440000"
}
```

### 4.3 POST /routes

Create new route.

**Request:**
```http
POST /v1/routes HTTP/1.1
Host: api.walkingaudit.ie
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Terenure to Grand Canal",
  "description": "Main walking route through Rathmines",
  "town_city": "Dublin",
  "county": "Dublin",
  "eircode": "D06 ABC1",
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-6.2582, 53.3169],
      [-6.2570, 53.3180],
      [-6.2547, 53.3223]
    ]
  },
  "route_type": "urban",
  "surface_type": "paved",
  "lighting": "full",
  "permeability_score": 3,
  "has_public_transport": true,
  "tags": ["accessible", "scenic"],
  "is_public": true
}
```

**Success Response (201 Created):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Terenure to Grand Canal",
    "town_city": "Dublin",
    "county": "Dublin",
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [-6.2582, 53.3169],
        [-6.2570, 53.3180],
        [-6.2547, 53.3223]
      ]
    },
    "distance_meters": 2860.5,
    "bbox": {
      "type": "Polygon",
      "coordinates": [[...]]
    },
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "type": "https://api.walkingaudit.ie/errors/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "Invalid geometry",
  "errors": [
    {
      "field": "geometry",
      "message": "LineString must have at least 2 coordinates",
      "code": "INVALID_GEOMETRY"
    }
  ]
}
```

### 4.4 PATCH /routes/:id

Update route.

**Request:**
```http
PATCH /v1/routes/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: api.walkingaudit.ie
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "description": "Updated description with more details",
  "tags": ["accessible", "scenic", "school_route"],
  "is_featured": true
}
```

**Success Response (200 OK):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "description": "Updated description with more details",
    "tags": ["accessible", "scenic", "school_route"],
    "is_featured": true,
    "updated_at": "2025-01-15T11:00:00Z"
  }
}
```

### 4.5 DELETE /routes/:id

Delete route.

**Request:**
```http
DELETE /v1/routes/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: api.walkingaudit.ie
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (204 No Content):**
```http
HTTP/1.1 204 No Content
```

**Error Response (409 Conflict):**
```json
{
  "type": "https://api.walkingaudit.ie/errors/conflict",
  "title": "Cannot Delete Resource",
  "status": 409,
  "detail": "Cannot delete route with existing audits. Please archive instead"
}
```

### 4.6 GET /routes/nearby

Find routes near a location.

**Request:**
```http
GET /v1/routes/nearby?lat=53.3169&lng=-6.2582&radius=5000&limit=10 HTTP/1.1
Host: api.walkingaudit.ie
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `lat` (float, required): Latitude
- `lng` (float, required): Longitude
- `radius` (integer): Search radius in meters (default: 1000, max: 50000)
- `limit` (integer): Max results (default: 10, max: 50)

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Terenure to Grand Canal",
      "distance_from_point_meters": 342.5,
      "town_city": "Dublin",
      "county": "Dublin",
      "audit_count": 3,
      "avg_score": 3.2
    }
  ]
}
```

---

## 5. Audit Endpoints

### 5.1 POST /audits

Create new audit.

**Request:**
```http
POST /v1/audits HTTP/1.1
Host: api.walkingaudit.ie
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "route_id": "550e8400-e29b-41d4-a716-446655440000",
  "audit_date": "2025-01-15",
  "start_time": "14:30",
  "end_time": "16:00",
  "weather": "Sunny, 12°C",
  "temperature_celsius": 12,
  "is_school_route": false,
  "peak_time": false,
  
  "participants": [
    {
      "age_group": "26-64",
      "sex": "female",
      "abilities": ["wheelchair_user"]
    },
    {
      "age_group": "5-12",
      "sex": "male",
      "abilities": ["none"]
    }
  ],
  
  "sections": [
    {
      "section": "footpaths",
      "score": 3,
      "responses": {
        "main_problems": ["not_wide_enough", "need_to_step_off"],
        "surface_condition": ["cracks", "uneven_surfaces"],
        "obstacles": ["overgrown_hedges", "bollards"]
      },
      "comments": "Narrow footpaths force wheelchair users into road during busy times",
      "problem_areas": ["Rathgar Road junction", "Outside shops on Rathmines"]
    },
    {
      "section": "facilities",
      "score": 2,
      "responses": {
        "seating_issues": ["no_seating", "not_enough_rest_areas"],
        "toilet_issues": ["no_toilets"],
        "parking_issues": ["not_enough_cycle_parking"]
      },
      "comments": "No public seating for 1.6km stretch"
    },
    {
      "section": "crossing_road",
      "score": 3,
      "responses": {
        "formal_crossing_issues": ["long_wait_times"],
        "informal_crossing_issues": ["difficult_to_cross"]
      }
    },
    {
      "section": "road_user_behaviour",
      "score": 3,
      "responses": {
        "driver_behaviour": ["speeding"],
        "parking_practices": ["footpath_parking"]
      }
    },
    {
      "section": "safety",
      "score": 2,
      "responses": {
        "personal_safety_issues": ["poor_visibility"],
        "lighting_issues": ["inadequate_lighting"]
      }
    },
    {
      "section": "look_and_feel",
      "score": 2,
      "responses": {
        "attractive_pleasant_issues": ["litter"],
        "noise_issues": ["traffic_noise"]
      }
    }
  ],
  
  "enjoyed_most": "Wide pavements near canal, lots of greenery",
  "disliked_most": "Too much traffic noise, difficult crossings",
  "enjoyability_rating": 3,
  "would_walk_more": true,
  "would_recommend": true
}
```

**Success Response (201 Created):**
```json
{
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "route_id": "550e8400-e29b-41d4-a716-446655440000",
    "coordinator_id": "...",
    "audit_date": "2025-01-15",
    "status": "completed",
    "total_score": 15,
    "max_possible_score": 18,
    "normalized_score": 2.5,
    "walkability_rating": "Fair",
    "report_pdf_url": null,
    "created_at": "2025-01-15T16:05:00Z",
    "completed_at": "2025-01-15T16:05:00Z"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "type": "https://api.walkingaudit.ie/errors/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "Invalid audit data",
  "errors": [
    {
      "field": "route_id",
      "message": "Route ID is required",
      "code": "REQUIRED_FIELD"
    },
    {
      "field": "sections",
      "message": "Must have at least 6 sections",
      "code": "INSUFFICIENT_SECTIONS"
    }
  ]
}
```

### 5.2 GET /audits

List audits.

**Request:**
```http
GET /v1/audits?status=completed&route_id=550e8400&county=Dublin&date_from=2025-01-01&limit=20 HTTP/1.1
Host: api.walkingaudit.ie
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `status` (string): Filter by status (draft, in_progress, completed, reviewed, archived)
- `route_id` (uuid): Filter by route
- `county` (string): Filter by county
- `date_from` (date): Start date (YYYY-MM-DD)
- `date_to` (date): End date (YYYY-MM-DD)
- `is_school_route` (boolean): Filter school routes
- `coordinator_id` (uuid): Filter by coordinator
- `search` (string): Search in comments
- `sort` (string): Sort field (default: -audit_date)
- `limit` (integer): Results per page

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "route": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Terenure to Grand Canal",
        "county": "Dublin"
      },
      "coordinator": {
        "id": "...",
        "name": "John Doe",
        "organization": "Dublin City Council"
      },
      "audit_date": "2025-01-15",
      "status": "completed",
      "total_score": 15,
      "max_possible_score": 18,
      "normalized_score": 2.5,
      "walkability_rating": "Fair",
      "participant_count": 2,
      "issue_count": 12,
      "photo_count": 8,
      "recommendation_count": 4,
      "completed_at": "2025-01-15T16:05:00Z",
      "report_pdf_url": "https://storage.walkingaudit.ie/reports/660e8400.pdf"
    }
  ],
  "pagination": {
    "total": 127,
    "count": 20,
    "per_page": 20,
    "current_page": 1,
    "total_pages": 7,
    "has_more": true
  }
}
```

### 5.3 GET /audits/:id

Get single audit with full details.

**Request:**
```http
GET /v1/audits/660e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: api.walkingaudit.ie
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "route": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Terenure to Grand Canal",
      "town_city": "Dublin",
      "county": "Dublin",
      "distance_meters": 2860.5,
      "geometry": {...}
    },
    "coordinator": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "organization": "Dublin City Council"
    },
    
    "audit_date": "2025-01-15",
    "start_time": "14:30:00",
    "end_time": "16:00:00",
    "duration_minutes": 90,
    "weather": "Sunny, 12°C",
    "temperature_celsius": 12,
    "is_school_route": false,
    "peak_time": false,
    "status": "completed",
    
    "participants": [
      {
        "id": "...",
        "age_group": "26-64",
        "sex": "female",
        "abilities": ["wheelchair_user"],
        "participated_at": "2025-01-15T14:30:00Z"
      },
      {
        "id": "...",
        "age_group": "5-12",
        "sex": "male",
        "abilities": ["none"],
        "participated_at": "2025-01-15T14:30:00Z"
      }
    ],
    
    "sections": [
      {
        "id": "...",
        "section": "footpaths",
        "score": 3,
        "responses": {
          "main_problems": ["not_wide_enough", "need_to_step_off"],
          "surface_condition": ["cracks", "uneven_surfaces"],
          "obstacles": ["overgrown_hedges", "bollards"]
        },
        "comments": "Narrow footpaths force wheelchair users into road",
        "problem_areas": ["Rathgar Road junction"],
        "created_at": "2025-01-15T15:00:00Z"
      }
      // ... other sections
    ],
    
    "issues": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "section": "footpaths",
        "category": "footpath",
        "severity": "high",
        "title": "Narrow pavement forces wheelchair into road",
        "description": "Footpath width is only 1.2m at this point",
        "location": {
          "type": "Point",
          "coordinates": [-6.2570, 53.3180]
        },
        "location_description": "Outside Supervalu on Rathgar Road",
        "photo_count": 2,
        "la_status": "open",
        "created_at": "2025-01-15T15:30:00Z"
      }
      // ... other issues
    ],
    
    "recommendations": [
      {
        "id": "...",
        "priority": 1,
        "title": "Widen footpath on Rathgar Road",
        "description": "Increase width from 1.2m to 2.0m minimum",
        "rationale": "Essential for wheelchair accessibility",
        "category": "infrastructure",
        "complexity": "major_project",
        "estimated_cost_euros": 50000,
        "estimated_timeframe": "Q2 2025",
        "issue_count": 5,
        "la_status": "pending"
      }
      // ... other recommendations
    ],
    
    "scores": {
      "footpaths": 3,
      "facilities": 2,
      "crossings": 3,
      "behaviour": 3,
      "safety": 2,
      "look_feel": 2
    },
    
    "total_score": 15,
    "max_possible_score": 18,
    "normalized_score": 2.5,
    "walkability_rating": "Fair",
    
    "enjoyability_rating": 3,
    "would_walk_more": true,
    "would_recommend": true,
    "enjoyed_most": "Wide pavements near canal",
    "disliked_most": "Too much traffic noise",
    
    "report_pdf_url": "https://storage.walkingaudit.ie/reports/660e8400.pdf",
    "report_generated_at": "2025-01-15T16:10:00Z",
    
    "created_at": "2025-01-15T14:25:00Z",
    "updated_at": "2025-01-15T16:10:00Z",
    "completed_at": "2025-01-15T16:05:00Z",
    "version": 1
  }
}
```

### 5.4 PATCH /audits/:id

Update audit (limited fields after completion).

**Request:**
```http
PATCH /v1/audits/660e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: api.walkingaudit.ie
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "status": "reviewed"
}
```

**Success Response (200 OK):**
```json
{
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "status": "reviewed",
    "reviewed_at": "2025-01-16T09:00:00Z",
    "updated_at": "2025-01-16T09:00:00Z"
  }
}
```

### 5.5 DELETE /audits/:id

Delete audit (soft delete).

**Request:**
```http
DELETE /v1/audits/660e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: api.walkingaudit.ie
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (204 No Content):**
```http
HTTP/1.1 204 No Content
```

---

*[Document continues with remaining endpoint specifications...]*

---

## Document Control

**Last Updated:** 2025-01-11  
**Next Review:** 2025-02-01

**Version History:**
- v1.0 (2025-01-11): Initial comprehensive API specification

**Related Documents:**
- Part 1: Main PRD & Architecture
- Part 2: Database Complete Specification
- Part 4: Frontend Complete Implementation

---

**END OF PART 3 (API Complete Specification)**
