# Walking Audit Web Application
# Technical Product Requirements Document
# Part 5: Backend Services Implementation

**Version:** 1.0  
**Last Updated:** January 2025  
**Document Owner:** Backend Architecture Team  
**Status:** Development Ready

---

## Document Overview

This is **Part 5 of 6** in the complete Walking Audit App technical documentation:

1. Main PRD & Architecture
2. Database Complete Specification
3. API Complete Specification
4. Frontend Complete Implementation
5. **Backend Services Implementation** ← You are here
6. Testing & DevOps

---

## Table of Contents

1. [Backend Architecture](#1-backend-architecture)
2. [Express Server Setup](#2-express-server-setup)
3. [Authentication Service](#3-authentication-service)
4. [Audit Service](#4-audit-service)
5. [Sync Service](#5-sync-service)
6. [Photo Processing Service](#6-photo-processing-service)
7. [PDF Generation Service](#7-pdf-generation-service)
8. [Email Service](#8-email-service)
9. [Analytics Service](#9-analytics-service)
10. [Background Jobs](#10-background-jobs)

---

## 1. Backend Architecture

### 1.1 Service Layer Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                              │
│  (Express Routes + Middleware)                              │
│  • Authentication                                           │
│  • Request Validation                                       │
│  • Rate Limiting                                            │
│  • Error Handling                                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│                   Controller Layer                          │
│  • Parse request                                            │
│  • Call appropriate service                                 │
│  • Format response                                          │
│  • Handle errors                                            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                            │
│  • Business logic                                           │
│  • Orchestration                                            │
│  • Transaction management                                   │
│  • Call multiple repositories                               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│                  Repository Layer                           │
│  • Database queries (Prisma)                                │
│  • Cache operations (Redis)                                 │
│  • External API calls                                       │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Project Structure

```
backend/
├── src/
│   ├── server.ts                     # Entry point
│   ├── app.ts                        # Express app setup
│   │
│   ├── routes/                       # API routes
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   ├── audit.routes.ts
│   │   ├── route.routes.ts
│   │   ├── issue.routes.ts
│   │   ├── photo.routes.ts
│   │   ├── recommendation.routes.ts
│   │   ├── report.routes.ts
│   │   └── analytics.routes.ts
│   │
│   ├── controllers/                  # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── audit.controller.ts
│   │   ├── route.controller.ts
│   │   ├── issue.controller.ts
│   │   ├── photo.controller.ts
│   │   ├── recommendation.controller.ts
│   │   ├── report.controller.ts
│   │   └── analytics.controller.ts
│   │
│   ├── services/                     # Business logic
│   │   ├── auth.service.ts
│   │   ├── audit.service.ts
│   │   ├── route.service.ts
│   │   ├── issue.service.ts
│   │   ├── photo.service.ts
│   │   ├── recommendation.service.ts
│   │   ├── report.service.ts
│   │   ├── email.service.ts
│   │   ├── sync.service.ts
│   │   └── analytics.service.ts
│   │
│   ├── repositories/                 # Data access
│   │   ├── audit.repository.ts
│   │   ├── route.repository.ts
│   │   ├── user.repository.ts
│   │   └── issue.repository.ts
│   │
│   ├── middleware/                   # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── rateLimit.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── logging.middleware.ts
│   │
│   ├── jobs/                         # Background jobs
│   │   ├── pdf-generation.job.ts
│   │   ├── email-sender.job.ts
│   │   ├── sync-processor.job.ts
│   │   └── analytics-refresh.job.ts
│   │
│   ├── utils/                        # Utilities
│   │   ├── jwt.util.ts
│   │   ├── crypto.util.ts
│   │   ├── email.util.ts
│   │   ├── validation.util.ts
│   │   └── spatial.util.ts
│   │
│   ├── config/                       # Configuration
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── email.config.ts
│   │   └── maps.config.ts
│   │
│   ├── types/                        # TypeScript types
│   │   ├── express.d.ts
│   │   ├── audit.types.ts
│   │   └── api.types.ts
│   │
│   └── prisma/                       # Prisma
│       ├── schema.prisma
│       └── migrations/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example
├── .eslintrc.json
├── tsconfig.json
├── package.json
└── README.md
```

---

## 2. Express Server Setup

### 2.1 Main Server Entry Point

```typescript
// src/server.ts
import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDatabase } from './config/database.config';
import { connectRedis } from './config/redis.config';
import { logger } from './utils/logger.util';

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('✅ Database connected');
    
    // Connect to Redis
    await connectRedis();
    logger.info('✅ Redis connected');
    
    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
      logger.info(`📍 API URL: http://localhost:${PORT}/v1`);
    });
    
    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`${signal} received, closing server gracefully...`);
      
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
      
      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

### 2.2 Express App Configuration

```typescript
// src/app.ts
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';

// Routes
import authRoutes from './routes/auth.routes';
import auditRoutes from './routes/audit.routes';
import routeRoutes from './routes/route.routes';
import issueRoutes from './routes/issue.routes';
import photoRoutes from './routes/photo.routes';
import recommendationRoutes from './routes/recommendation.routes';
import reportRoutes from './routes/report.routes';
import analyticsRoutes from './routes/analytics.routes';

// Middleware
import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';
import { requestLogger } from './middleware/logging.middleware';

const app: Application = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet - Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://maps.googleapis.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", process.env.FRONTEND_URL || ''],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow Google Maps
  })
);

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: [
      'X-Request-ID',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    type: 'https://api.walkingaudit.ie/errors/rate-limit-exceeded',
    title: 'Too Many Requests',
    status: 429,
    detail: 'You have exceeded the rate limit. Please try again later.',
  },
});

app.use('/v1/', limiter);

// ============================================
// GENERAL MIDDLEWARE
// ============================================

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Custom request logger
app.use(requestLogger);

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// ============================================
// API ROUTES
// ============================================

const API_VERSION = '/v1';

app.use(`${API_VERSION}/auth`, authRoutes);
app.use(`${API_VERSION}/audits`, auditRoutes);
app.use(`${API_VERSION}/routes`, routeRoutes);
app.use(`${API_VERSION}/issues`, issueRoutes);
app.use(`${API_VERSION}/photos`, photoRoutes);
app.use(`${API_VERSION}/recommendations`, recommendationRoutes);
app.use(`${API_VERSION}/reports`, reportRoutes);
app.use(`${API_VERSION}/analytics`, analyticsRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
```

---

## 3. Authentication Service

### 3.1 Auth Service Implementation

```typescript
// src/services/auth.service.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/config/database.config';
import { sendEmail } from './email.service';
import type { User } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const BCRYPT_ROUNDS = 12;

export class AuthService {
  /**
   * Register new user
   */
  static async register(data: {
    email: string;
    password: string;
    name: string;
    role?: string;
    organization?: string;
    county?: string;
  }): Promise<{
    user: User;
    token: string;
    refreshToken: string;
  }> {
    // Check if email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    
    if (existingUser) {
      throw new Error('Email already registered');
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    
    // Generate verification token
    const verificationToken = uuidv4();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password_hash: passwordHash,
        name: data.name,
        role: data.role as any || 'auditor',
        organization: data.organization,
        county: data.county,
        verification_token: verificationToken,
        verification_expires: verificationExpires,
      },
    });
    
    // Send verification email
    await sendEmail({
      to: user.email,
      subject: 'Verify your email - Walking Audit App',
      template: 'email-verification',
      data: {
        name: user.name,
        verification_url: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`,
      },
    });
    
    // Generate tokens
    const { token, refreshToken } = this.generateTokens(user);
    
    // Log activity
    await this.logActivity(user.id, 'REGISTER', null);
    
    return { user, token, refreshToken };
  }
  
  /**
   * Login user
   */
  static async login(
    email: string,
    password: string
  ): Promise<{
    user: User;
    token: string;
    refreshToken: string;
  }> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    
    if (!user || user.deleted_at) {
      throw new Error('Invalid email or password');
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      // Log failed attempt
      await this.logActivity(user.id, 'LOGIN_FAILED', null);
      throw new Error('Invalid email or password');
    }
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });
    
    // Generate tokens
    const { token, refreshToken } = this.generateTokens(user);
    
    // Log activity
    await this.logActivity(user.id, 'LOGIN', null);
    
    return { user, token, refreshToken };
  }
  
  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<{ token: string }> {
    try {
      const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;
      
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      
      // Get user
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
      });
      
      if (!user || user.deleted_at) {
        throw new Error('User not found');
      }
      
      // Generate new access token
      const token = this.generateAccessToken(user);
      
      return { token };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
  
  /**
   * Verify email
   */
  static async verifyEmail(token: string): Promise<User> {
    const user = await prisma.user.findFirst({
      where: {
        verification_token: token,
        verification_expires: { gt: new Date() },
      },
    });
    
    if (!user) {
      throw new Error('Invalid or expired verification token');
    }
    
    // Update user
    const verified = await prisma.user.update({
      where: { id: user.id },
      data: {
        email_verified: true,
        verification_token: null,
        verification_expires: null,
      },
    });
    
    // Log activity
    await this.logActivity(user.id, 'EMAIL_VERIFIED', null);
    
    return verified;
  }
  
  /**
   * Request password reset
   */
  static async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    
    // Always return success (security best practice)
    if (!user || user.deleted_at) {
      return;
    }
    
    // Generate reset token
    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    // Save token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        reset_token: resetToken,
        reset_expires: resetExpires,
      },
    });
    
    // Send email
    await sendEmail({
      to: user.email,
      subject: 'Reset your password - Walking Audit App',
      template: 'password-reset',
      data: {
        name: user.name,
        reset_url: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
      },
    });
    
    // Log activity
    await this.logActivity(user.id, 'PASSWORD_RESET_REQUESTED', null);
  }
  
  /**
   * Reset password
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: {
        reset_token: token,
        reset_expires: { gt: new Date() },
      },
    });
    
    if (!user) {
      throw new Error('Invalid or expired reset token');
    }
    
    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    
    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: passwordHash,
        reset_token: null,
        reset_expires: null,
      },
    });
    
    // Log activity
    await this.logActivity(user.id, 'PASSWORD_RESET', null);
    
    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: 'Password changed - Walking Audit App',
      template: 'password-changed',
      data: {
        name: user.name,
      },
    });
  }
  
  /**
   * Generate JWT tokens
   */
  private static generateTokens(user: User): {
    token: string;
    refreshToken: string;
  } {
    const token = this.generateAccessToken(user);
    
    const refreshToken = jwt.sign(
      {
        sub: user.id,
        type: 'refresh',
      },
      JWT_REFRESH_SECRET,
      {
        expiresIn: '30d',
        jwtid: uuidv4(),
      }
    );
    
    return { token, refreshToken };
  }
  
  /**
   * Generate access token
   */
  private static generateAccessToken(user: User): string {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        organization: user.organization,
      },
      JWT_SECRET,
      {
        expiresIn: '24h',
        jwtid: uuidv4(),
      }
    );
  }
  
  /**
   * Verify JWT token
   */
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
  
  /**
   * Log authentication activity
   */
  private static async logActivity(
    userId: string,
    action: string,
    ip: string | null
  ): Promise<void> {
    await prisma.audit_log.create({
      data: {
        user_id: userId,
        action,
        entity_type: 'user',
        entity_id: userId,
        ip_address: ip,
        success: true,
      },
    });
  }
}
```

---

## 4. Audit Service

### 4.1 Audit Service Implementation

```typescript
// src/services/audit.service.ts
import { prisma } from '@/config/database.config';
import { redis } from '@/config/redis.config';
import { validateOrThrow, CreateAuditSchema } from '@/lib/validation/schemas';
import { queueJob } from '@/jobs/queue';
import type { Audit, CreateAuditRequest } from '@/types/audit';

export class AuditService {
  /**
   * Create new audit
   */
  static async create(
    userId: string,
    data: CreateAuditRequest
  ): Promise<Audit> {
    // Validate input
    const validated = validateOrThrow(CreateAuditSchema, data);
    
    // Check route exists
    const route = await prisma.route.findUnique({
      where: { id: validated.route_id },
    });
    
    if (!route) {
      throw new Error('Route not found');
    }
    
    // Create audit in transaction
    const audit = await prisma.$transaction(async (tx) => {
      // 1. Create audit
      const newAudit = await tx.audit.create({
        data: {
          route_id: validated.route_id,
          coordinator_id: userId,
          audit_date: new Date(validated.audit_date),
          start_time: validated.start_time,
          end_time: validated.end_time,
          weather: validated.weather,
          temperature_celsius: validated.temperature_celsius,
          is_school_route: validated.is_school_route,
          school_name: validated.school_name,
          peak_time: validated.peak_time,
          enjoyability_rating: validated.enjoyability_rating,
          would_walk_more: validated.would_walk_more,
          would_recommend: validated.would_recommend,
          liked_most: validated.enjoyed_most,
          disliked_most: validated.disliked_most,
          additional_comments: validated.additional_comments,
          status: 'completed',
          completed_at: new Date(),
        },
      });
      
      // 2. Create participants
      for (const participant of validated.participants) {
        const p = await tx.audit_participant.create({
          data: {
            audit_id: newAudit.id,
            age_group: participant.age_group,
            sex: participant.sex,
          },
        });
        
        // Add abilities
        if (participant.abilities && participant.abilities.length > 0) {
          await tx.participant_ability.createMany({
            data: participant.abilities.map((ability) => ({
              participant_id: p.id,
              ability: ability as any,
            })),
          });
        }
      }
      
      // 3. Create sections
      for (const section of validated.sections) {
        await tx.audit_section.create({
          data: {
            audit_id: newAudit.id,
            section: section.section as any,
            score: section.score,
            responses: section.responses,
            comments: section.comments,
            problem_areas: section.problem_areas,
          },
        });
      }
      
      return newAudit;
    });
    
    // Queue report generation (async)
    await queueJob('generate-pdf', {
      auditId: audit.id,
    });
    
    // Invalidate cache
    await redis.del(`route:${audit.route_id}`);
    await redis.del('audits:list:*');
    
    // Log activity
    await this.logActivity(userId, 'CREATE', 'audit', audit.id);
    
    return audit as any;
  }
  
  /**
   * Get audit by ID
   */
  static async getById(auditId: string, userId: string): Promise<Audit> {
    // Try cache first
    const cacheKey = `audit:${auditId}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Query database
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        route: true,
        coordinator: {
          select: {
            id: true,
            name: true,
            email: true,
            organization: true,
          },
        },
        participants: {
          include: {
            abilities: true,
          },
        },
        sections: true,
        issues: {
          include: {
            photos: true,
          },
          where: {
            deleted_at: null,
          },
        },
        recommendations: {
          where: {
            deleted_at: null,
          },
          orderBy: {
            priority: 'asc',
          },
        },
      },
    });
    
    if (!audit) {
      throw new Error('Audit not found');
    }
    
    // Check permissions
    await this.checkReadPermission(audit, userId);
    
    // Cache for 30 minutes
    await redis.setex(cacheKey, 1800, JSON.stringify(audit));
    
    return audit as any;
  }
  
  /**
   * List audits
   */
  static async list(
    userId: string,
    params: {
      status?: string;
      route_id?: string;
      county?: string;
      date_from?: string;
      date_to?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ data: Audit[]; pagination: any }> {
    const {
      status,
      route_id,
      county,
      date_from,
      date_to,
      limit = 20,
      offset = 0,
    } = params;
    
    // Build where clause
    const where: any = {
      deleted_at: null,
    };
    
    if (status) {
      where.status = status;
    }
    
    if (route_id) {
      where.route_id = route_id;
    }
    
    if (county) {
      where.route = {
        county: county,
      };
    }
    
    if (date_from || date_to) {
      where.audit_date = {};
      if (date_from) {
        where.audit_date.gte = new Date(date_from);
      }
      if (date_to) {
        where.audit_date.lte = new Date(date_to);
      }
    }
    
    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    // Filter based on role
    if (user?.role === 'auditor' || user?.role === 'coordinator') {
      where.coordinator_id = userId;
    } else if (user?.role === 'la_admin') {
      where.route = {
        county: user.county,
      };
    }
    // system_admin can see all
    
    // Count total
    const total = await prisma.audit.count({ where });
    
    // Fetch audits
    const audits = await prisma.audit.findMany({
      where,
      include: {
        route: {
          select: {
            id: true,
            name: true,
            county: true,
          },
        },
        coordinator: {
          select: {
            id: true,
            name: true,
            organization: true,
          },
        },
        _count: {
          select: {
            participants: true,
            issues: true,
            photos: true,
            recommendations: true,
          },
        },
      },
      orderBy: {
        audit_date: 'desc',
      },
      take: limit,
      skip: offset,
    });
    
    const pagination = {
      total,
      count: audits.length,
      per_page: limit,
      current_page: Math.floor(offset / limit) + 1,
      total_pages: Math.ceil(total / limit),
      has_more: offset + audits.length < total,
    };
    
    return {
      data: audits as any,
      pagination,
    };
  }
  
  /**
   * Update audit
   */
  static async update(
    auditId: string,
    userId: string,
    data: Partial<Audit>
  ): Promise<Audit> {
    // Get existing audit
    const existing = await prisma.audit.findUnique({
      where: { id: auditId },
    });
    
    if (!existing) {
      throw new Error('Audit not found');
    }
    
    // Check permissions
    await this.checkWritePermission(existing, userId);
    
    // Update
    const updated = await prisma.audit.update({
      where: { id: auditId },
      data: {
        ...data,
        version: existing.version + 1,
      },
    });
    
    // Invalidate cache
    await redis.del(`audit:${auditId}`);
    
    // Log activity
    await this.logActivity(userId, 'UPDATE', 'audit', auditId);
    
    return updated as any;
  }
  
  /**
   * Delete audit (soft delete)
   */
  static async delete(auditId: string, userId: string): Promise<void> {
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
    });
    
    if (!audit) {
      throw new Error('Audit not found');
    }
    
    // Check permissions
    await this.checkWritePermission(audit, userId);
    
    // Soft delete
    await prisma.audit.update({
      where: { id: auditId },
      data: {
        deleted_at: new Date(),
      },
    });
    
    // Invalidate cache
    await redis.del(`audit:${auditId}`);
    
    // Log activity
    await this.logActivity(userId, 'DELETE', 'audit', auditId);
  }
  
  /**
   * Check read permission
   */
  private static async checkReadPermission(
    audit: any,
    userId: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      throw new Error('Unauthorized');
    }
    
    // System admin can read all
    if (user.role === 'system_admin') {
      return;
    }
    
    // LA admin can read audits in their county
    if (user.role === 'la_admin') {
      if (audit.route.county === user.county) {
        return;
      }
    }
    
    // Coordinators/auditors can only read their own
    if (audit.coordinator_id === userId) {
      return;
    }
    
    throw new Error('Forbidden');
  }
  
  /**
   * Check write permission
   */
  private static async checkWritePermission(
    audit: any,
    userId: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      throw new Error('Unauthorized');
    }
    
    // System admin can write all
    if (user.role === 'system_admin') {
      return;
    }
    
    // Only coordinator can edit their own audit
    if (audit.coordinator_id === userId) {
      // Can only edit within 24 hours of creation
      const hoursSinceCreation =
        (Date.now() - new Date(audit.created_at).getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceCreation > 24) {
        throw new Error('Cannot edit audit after 24 hours');
      }
      
      return;
    }
    
    throw new Error('Forbidden');
  }
  
  /**
   * Log activity
   */
  private static async logActivity(
    userId: string,
    action: string,
    entityType: string | null,
    entityId: string | null
  ): Promise<void> {
    await prisma.audit_log.create({
      data: {
        user_id: userId,
        action,
        entity_type: entityType || 'user',
        entity_id: entityId,
        success: true,
      },
    });
  }
}
```

---

## 5. Sync Service

### 5.1 Sync Service for Offline Queue

```typescript
// src/services/sync.service.ts
import { prisma } from '@/config/database.config';
import { AuditService } from './audit.service';
import { PhotoService } from './photo.service';
import { IssueService } from './issue.service';
import { logger } from '@/utils/logger.util';

export class SyncService {
  /**
   * Process sync queue
   */
  static async processQueue(): Promise<{
    processed: number;
    failed: number;
  }> {
    let processed = 0;
    let failed = 0;
    
    // Get pending items (prioritized)
    const items = await prisma.sync_queue.findMany({
      where: {
        status: 'pending',
        attempts: {
          lt: prisma.sync_queue.fields.max_attempts,
        },
      },
      orderBy: [
        { priority: 'desc' }, // high > normal > low
        { created_at: 'asc' }, // oldest first
      ],
      take: 100, // Process 100 at a time
    });
    
    for (const item of items) {
      try {
        await this.processItem(item);
        processed++;
      } catch (error: any) {
        logger.error(`Sync failed for ${item.entity_type}:${item.entity_id}`, error);
        failed++;
        await this.handleFailure(item, error);
      }
    }
    
    logger.info(`Sync complete: ${processed} processed, ${failed} failed`);
    
    return { processed, failed };
  }
  
  /**
   * Process single sync item
   */
  private static async processItem(item: any): Promise<void> {
    // Update status
    await prisma.sync_queue.update({
      where: { id: item.id },
      data: {
        status: 'processing',
        last_attempt_at: new Date(),
      },
    });
    
    try {
      switch (item.entity_type) {
        case 'audit':
          await this.syncAudit(item);
          break;
          
        case 'photo':
          await this.syncPhoto(item);
          break;
          
        case 'issue':
          await this.syncIssue(item);
          break;
          
        case 'recommendation':
          await this.syncRecommendation(item);
          break;
          
        default:
          throw new Error(`Unknown entity type: ${item.entity_type}`);
      }
      
      // Mark as completed
      await prisma.sync_queue.update({
        where: { id: item.id },
        data: {
          status: 'completed',
          processed_at: new Date(),
          completed_at: new Date(),
        },
      });
      
    } catch (error) {
      // Increment attempts
      await prisma.sync_queue.update({
        where: { id: item.id },
        data: {
          status: 'pending',
          attempts: item.attempts + 1,
          last_error: (error as Error).message,
        },
      });
      
      throw error;
    }
  }
  
  /**
   * Sync audit from offline queue
   */
  private static async syncAudit(item: any): Promise<void> {
    const audit = await AuditService.create(
      item.user_id,
      item.payload
    );
    
    logger.info(`Synced audit ${audit.id} from offline queue`);
  }
  
  /**
   * Sync photo from offline queue
   */
  private static async syncPhoto(item: any): Promise<void> {
    // Payload contains base64 encoded photo
    const { file_data, metadata } = item.payload;
    
    // Convert base64 to buffer
    const buffer = Buffer.from(file_data, 'base64');
    
    // Upload photo
    const photo = await PhotoService.upload(
      item.user_id,
      buffer,
      metadata
    );
    
    logger.info(`Synced photo ${photo.id} from offline queue`);
  }
  
  /**
   * Sync issue from offline queue
   */
  private static async syncIssue(item: any): Promise<void> {
    const issue = await IssueService.create(
      item.user_id,
      item.payload
    );
    
    logger.info(`Synced issue ${issue.id} from offline queue`);
  }
  
  /**
   * Sync recommendation from offline queue
   */
  private static async syncRecommendation(item: any): Promise<void> {
    // Similar to above
  }
  
  /**
   * Handle sync failure
   */
  private static async handleFailure(item: any, error: Error): Promise<void> {
    if (item.attempts + 1 >= item.max_attempts) {
      // Max attempts reached, mark as failed
      await prisma.sync_queue.update({
        where: { id: item.id },
        data: {
          status: 'failed',
          last_error: error.message,
        },
      });
      
      // TODO: Notify user
    } else {
      // Will retry
      logger.warn(
        `Sync failed for ${item.entity_type}:${item.entity_id}, ` +
        `attempt ${item.attempts + 1}/${item.max_attempts}`
      );
    }
  }
}
```

---

## 6. Photo Processing Service

### 6.1 Photo Service Implementation

```typescript
// src/services/photo.service.ts
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '@/config/storage.config';
import { prisma } from '@/config/database.config';
import { extractEXIF } from '@/utils/exif.util';
import type { Photo } from '@/types/photo';

export class PhotoService {
  /**
   * Upload photo
   */
  static async upload(
    userId: string,
    buffer: Buffer,
    metadata: {
      audit_id: string;
      issue_id?: string;
      location?: { lat: number; lng: number };
      taken_at?: string;
    }
  ): Promise<Photo> {
    const photoId = uuidv4();
    
    // Extract EXIF data
    const exifData = await extractEXIF(buffer);
    
    // Compress original if needed
    let processedBuffer = buffer;
    const metadata_sharp = await sharp(buffer).metadata();
    const originalSize = buffer.length;
    
    if (originalSize > 1024 * 1024) {
      // Compress to ~800KB
      processedBuffer = await sharp(buffer)
        .jpeg({
          quality: 85,
          progressive: true,
        })
        .toBuffer();
    }
    
    // Generate thumbnail
    const thumbnailBuffer = await sharp(buffer)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    // Upload to storage
    const originalFilename = `photos/${metadata.audit_id}/${photoId}.jpg`;
    const thumbnailFilename = `photos/${metadata.audit_id}/${photoId}_thumb.jpg`;
    
    const [originalUrl, thumbnailUrl] = await Promise.all([
      storage.upload(processedBuffer, originalFilename, 'image/jpeg'),
      storage.upload(thumbnailBuffer, thumbnailFilename, 'image/jpeg'),
    ]);
    
    // Extract location from EXIF or use provided
    let location = metadata.location;
    if (!location && exifData.gps) {
      location = {
        lat: this.convertDMSToDD(
          exifData.gps.latitude,
          exifData.gps.latitudeRef
        ),
        lng: this.convertDMSToDD(
          exifData.gps.longitude,
          exifData.gps.longitudeRef
        ),
      };
    }
    
    // Save to database
    const photo = await prisma.photo.create({
      data: {
        id: photoId,
        audit_id: metadata.audit_id,
        issue_id: metadata.issue_id,
        url: originalUrl,
        thumbnail_url: thumbnailUrl,
        filename: originalFilename,
        file_size_kb: Math.round(processedBuffer.length / 1024),
        mime_type: 'image/jpeg',
        width_px: metadata_sharp.width,
        height_px: metadata_sharp.height,
        location: location
          ? `SRID=4326;POINT(${location.lng} ${location.lat})`
          : null,
        location_source: location
          ? exifData.gps
            ? 'exif'
            : 'manual'
          : null,
        taken_at: metadata.taken_at
          ? new Date(metadata.taken_at)
          : exifData.datetime
          ? new Date(exifData.datetime)
          : new Date(),
        camera_make: exifData.make,
        camera_model: exifData.model,
        exif_data: exifData,
        compression_applied: originalSize > processedBuffer.length,
        uploaded_by: userId,
      },
    });
    
    // Log activity
    await this.logActivity(userId, 'UPLOAD', 'photo', photo.id);
    
    return photo as any;
  }
  
  /**
   * Get photos for audit
   */
  static async getByAudit(auditId: string): Promise<Photo[]> {
    const photos = await prisma.photo.findMany({
      where: {
        audit_id: auditId,
        deleted_at: null,
      },
      include: {
        issue: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        taken_at: 'asc',
      },
    });
    
    return photos as any;
  }
  
  /**
   * Delete photo
   */
  static async delete(photoId: string, userId: string): Promise<void> {
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
    });
    
    if (!photo) {
      throw new Error('Photo not found');
    }
    
    // Check permissions
    if (photo.uploaded_by !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'system_admin') {
        throw new Error('Forbidden');
      }
    }
    
    // Soft delete in database
    await prisma.photo.update({
      where: { id: photoId },
      data: {
        deleted_at: new Date(),
      },
    });
    
    // Delete from storage (async, don't wait)
    storage.delete(photo.url).catch((err) => {
      logger.error(`Failed to delete photo from storage: ${photo.url}`, err);
    });
    
    storage.delete(photo.thumbnail_url!).catch((err) => {
      logger.error(`Failed to delete thumbnail from storage`, err);
    });
    
    // Log activity
    await this.logActivity(userId, 'DELETE', 'photo', photoId);
  }
  
  /**
   * Convert DMS to Decimal Degrees
   */
  private static convertDMSToDD(
    dms: [number, number, number],
    ref: string
  ): number {
    const [degrees, minutes, seconds] = dms;
    let dd = degrees + minutes / 60 + seconds / 3600;
    if (ref === 'S' || ref === 'W') {
      dd = dd * -1;
    }
    return dd;
  }
  
  private static async logActivity(
    userId: string,
    action: string,
    entityType: string,
    entityId: string
  ): Promise<void> {
    await prisma.audit_log.create({
      data: {
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        success: true,
      },
    });
  }
}
```

---

## 7. PDF Generation Service

### 7.1 Report Service Implementation

```typescript
// src/services/report.service.ts
import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import path from 'path';
import fs from 'fs/promises';
import { prisma } from '@/config/database.config';
import { storage } from '@/config/storage.config';
import { AuditService } from './audit.service';
import { logger } from '@/utils/logger.util';

export class ReportService {
  /**
   * Generate PDF report for audit
   */
  static async generatePDF(auditId: string): Promise<string> {
    logger.info(`Generating PDF for audit ${auditId}`);
    
    try {
      // 1. Fetch complete audit data
      const audit = await this.fetchAuditData(auditId);
      
      // 2. Calculate metrics
      const metrics = await this.calculateMetrics(audit);
      
      // 3. Render HTML from template
      const html = await this.renderTemplate(audit, metrics);
      
      // 4. Generate PDF using Puppeteer
      const pdfBuffer = await this.htmlToPDF(html);
      
      // 5. Upload to storage
      const filename = `reports/audit-${auditId}-${Date.now()}.pdf`;
      const url = await storage.upload(pdfBuffer, filename, 'application/pdf');
      
      // 6. Update audit record
      await prisma.audit.update({
        where: { id: auditId },
        data: {
          report_pdf_url: url,
          report_generated_at: new Date(),
        },
      });
      
      logger.info(`PDF generated successfully: ${url}`);
      
      return url;
      
    } catch (error) {
      logger.error(`PDF generation failed for audit ${auditId}`, error);
      throw error;
    }
  }
  
  /**
   * Fetch audit data with all relations
   */
  private static async fetchAuditData(auditId: string): Promise<any> {
    return await prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        route: true,
        coordinator: true,
        participants: {
          include: {
            abilities: true,
          },
        },
        sections: true,
        issues: {
          include: {
            photos: {
              where: { deleted_at: null },
              take: 1, // First photo for each issue
            },
          },
          where: { deleted_at: null },
          orderBy: { severity: 'desc' },
        },
        recommendations: {
          where: { deleted_at: null },
          orderBy: { priority: 'asc' },
        },
        photos: {
          where: { deleted_at: null },
          orderBy: { taken_at: 'asc' },
          take: 12, // Max 12 photos in appendix
        },
      },
    });
  }
  
  /**
   * Calculate report metrics
   */
  private static async calculateMetrics(audit: any): Promise<any> {
    // Get or create report metrics
    let metrics = await prisma.report_metric.findUnique({
      where: { audit_id: audit.id },
    });
    
    if (!metrics || metrics.needs_regeneration) {
      // Calculate county average
      const countyAudits = await prisma.audit.findMany({
        where: {
          route: {
            county: audit.route.county,
          },
          status: 'completed',
          deleted_at: null,
        },
        select: {
          normalized_score: true,
        },
      });
      
      const countyAvg = countyAudits.length > 0
        ? countyAudits.reduce((sum, a) => sum + (a.normalized_score || 0), 0) /
          countyAudits.length
        : null;
      
      // National average
      const nationalAvg = await prisma.audit.aggregate({
        where: {
          status: 'completed',
          deleted_at: null,
        },
        _avg: {
          normalized_score: true,
        },
      });
      
      // Calculate issue categories
      const issueCounts = await prisma.issue.groupBy({
        by: ['category'],
        where: {
          audit_id: audit.id,
          deleted_at: null,
        },
        _count: true,
        orderBy: {
          _count: {
            category: 'desc',
          },
        },
        take: 3,
      });
      
      // Calculate section strengths/weaknesses
      const sections = audit.sections.sort((a: any, b: any) => b.score - a.score);
      
      // Create/update metrics
      metrics = await prisma.report_metric.upsert({
        where: { audit_id: audit.id },
        create: {
          audit_id: audit.id,
          footpaths_score: audit.footpaths_score,
          facilities_score: audit.facilities_score,
          crossings_score: audit.crossings_score,
          behaviour_score: audit.behaviour_score,
          safety_score: audit.safety_score,
          look_feel_score: audit.look_feel_score,
          school_gates_score: audit.school_gates_score,
          overall_score: audit.normalized_score,
          
          total_issues: audit.issues.length,
          critical_issues: audit.issues.filter((i: any) => i.severity === 'critical').length,
          high_issues: audit.issues.filter((i: any) => i.severity === 'high').length,
          medium_issues: audit.issues.filter((i: any) => i.severity === 'medium').length,
          low_issues: audit.issues.filter((i: any) => i.severity === 'low').length,
          
          total_photos: audit.photos.length,
          total_recommendations: audit.recommendations.length,
          total_participants: audit.participants.length,
          
          county_avg_score: countyAvg,
          national_avg_score: nationalAvg._avg.normalized_score,
          
          top_issue_category_1: issueCounts[0]?.category,
          top_issue_category_1_count: issueCounts[0]?._count || 0,
          top_issue_category_2: issueCounts[1]?.category,
          top_issue_category_2_count: issueCounts[1]?._count || 0,
          top_issue_category_3: issueCounts[2]?.category,
          top_issue_category_3_count: issueCounts[2]?._count || 0,
          
          top_strength_1: sections[0]?.section,
          top_strength_1_score: sections[0]?.score,
          top_strength_2: sections[1]?.section,
          top_strength_2_score: sections[1]?.score,
          
          top_weakness_1: sections[sections.length - 1]?.section,
          top_weakness_1_score: sections[sections.length - 1]?.score,
          top_weakness_2: sections[sections.length - 2]?.section,
          top_weakness_2_score: sections[sections.length - 2]?.score,
          
          needs_regeneration: false,
        },
        update: {
          needs_regeneration: false,
          generated_at: new Date(),
        },
      });
    }
    
    return metrics;
  }
  
  /**
   * Render HTML template
   */
  private static async renderTemplate(
    audit: any,
    metrics: any
  ): Promise<string> {
    // Load template
    const templatePath = path.join(
      __dirname,
      '../templates/report.hbs'
    );
    const templateSource = await fs.readFile(templatePath, 'utf-8');
    
    // Compile template
    const template = Handlebars.compile(templateSource);
    
    // Register helpers
    Handlebars.registerHelper('formatDate', (date: string) => {
      return new Date(date).toLocaleDateString('en-IE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    });
    
    Handlebars.registerHelper('scoreLabel', (score: number) => {
      const labels = ['', 'Poor', 'Fair', 'OK', 'Good', 'Excellent'];
      return labels[score] || '';
    });
    
    Handlebars.registerHelper('severityColor', (severity: string) => {
      const colors = {
        critical: '#D32F2F',
        high: '#F57C00',
        medium: '#FBC02D',
        low: '#388E3C',
      };
      return colors[severity as keyof typeof colors] || '#757575';
    });
    
    // Render
    const html = template({
      audit,
      metrics,
      generated_at: new Date().toISOString(),
    });
    
    return html;
  }
  
  /**
   * Convert HTML to PDF using Puppeteer
   */
  private static async htmlToPDF(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });
    
    try {
      const page = await browser.newPage();
      
      // Set content
      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
          <div style="font-size: 10px; text-align: center; width: 100%; color: #888;">
            Page <span class="pageNumber"></span> of <span class="totalPages"></span>
          </div>
        `,
      });
      
      return pdfBuffer;
      
    } finally {
      await browser.close();
    }
  }
  
  /**
   * Email PDF report
   */
  static async emailReport(
    auditId: string,
    recipientEmail: string,
    subject: string,
    message: string
  ): Promise<void> {
    // Get audit
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        route: true,
      },
    });
    
    if (!audit) {
      throw new Error('Audit not found');
    }
    
    if (!audit.report_pdf_url) {
      throw new Error('Report not yet generated');
    }
    
    // Queue email
    await prisma.email_queue.create({
      data: {
        recipient_email: recipientEmail,
        subject: subject || `Walking Audit Report: ${audit.route.name}`,
        body_text: message,
        template_name: 'audit-report-email',
        template_data: {
          audit_name: audit.route.name,
          audit_date: audit.audit_date,
          message,
        },
        attachments: [
          {
            filename: `walking-audit-${audit.route.name}.pdf`,
            url: audit.report_pdf_url,
          },
        ],
        email_type: 'report_ready',
        priority: 'normal',
      },
    });
    
    logger.info(`Report email queued for ${recipientEmail}`);
  }
  
  private static convertDMSToDD(
    dms: [number, number, number],
    ref: string
  ): number {
    const [degrees, minutes, seconds] = dms;
    let dd = degrees + minutes / 60 + seconds / 3600;
    if (ref === 'S' || ref === 'W') {
      dd = dd * -1;
    }
    return dd;
  }
  
  private static async logActivity(
    userId: string,
    action: string,
    entityType: string,
    entityId: string
  ): Promise<void> {
    await prisma.audit_log.create({
      data: {
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        success: true,
      },
    });
  }
}
```

---

## 8. Email Service

### 8.1 Email Service Implementation

```typescript
// src/services/email.service.ts
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import Handlebars from 'handlebars';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '@/utils/logger.util';
import { prisma } from '@/config/database.config';

const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'sendgrid'; // sendgrid | resend | smtp

// SendGrid setup
const sgMail = require('@sendgrid/mail');
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Resend setup
const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string;
  subject: string;
  template?: string;
  data?: Record<string, any>;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    url: string;
  }>;
}

export class EmailService {
  /**
   * Send email
   */
  static async send(options: EmailOptions): Promise<void> {
    try {
      let html = options.html;
      let text = options.text;
      
      // Render template if provided
      if (options.template) {
        const rendered = await this.renderTemplate(
          options.template,
          options.data || {}
        );
        html = rendered.html;
        text = rendered.text;
      }
      
      if (!html && !text) {
        throw new Error('Email must have html or text content');
      }
      
      // Send based on provider
      switch (EMAIL_PROVIDER) {
        case 'sendgrid':
          await this.sendViaSendGrid(options.to, options.subject, html!, text);
          break;
          
        case 'resend':
          await this.sendViaResend(options.to, options.subject, html!, text);
          break;
          
        case 'smtp':
          await this.sendViaSMTP(options.to, options.subject, html!, text, options.attachments);
          break;
          
        default:
          throw new Error(`Unknown email provider: ${EMAIL_PROVIDER}`);
      }
      
      logger.info(`Email sent to ${options.to}: ${options.subject}`);
      
    } catch (error) {
      logger.error(`Failed to send email to ${options.to}`, error);
      throw error;
    }
  }
  
  /**
   * Send via SendGrid
   */
  private static async sendViaSendGrid(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<void> {
    await sgMail.send({
      to,
      from: {
        email: process.env.FROM_EMAIL!,
        name: 'Walking Audit App',
      },
      subject,
      text: text || '',
      html,
    });
  }
  
  /**
   * Send via Resend
   */
  private static async sendViaResend(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<void> {
    await resend.emails.send({
      from: `Walking Audit App <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html,
      text,
    });
  }
  
  /**
   * Send via SMTP
   */
  private static async sendViaSMTP(
    to: string,
    subject: string,
    html: string,
    text?: string,
    attachments?: Array<{ filename: string; url: string }>
  ): Promise<void> {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    
    await transporter.sendMail({
      from: `"Walking Audit App" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      text,
      html,
      attachments: attachments?.map((att) => ({
        filename: att.filename,
        path: att.url,
      })),
    });
  }
  
  /**
   * Render email template
   */
  private static async renderTemplate(
    templateName: string,
    data: Record<string, any>
  ): Promise<{ html: string; text: string }> {
    // Load template
    const templatePath = path.join(
      __dirname,
      `../templates/emails/${templateName}.hbs`
    );
    
    const templateSource = await fs.readFile(templatePath, 'utf-8');
    
    // Compile
    const template = Handlebars.compile(templateSource);
    
    // Render
    const html = template(data);
    
    // Generate plain text version (simple strip HTML)
    const text = html.replace(/<[^>]*>/g, '');
    
    return { html, text };
  }
  
  /**
   * Process email queue
   */
  static async processQueue(): Promise<{
    sent: number;
    failed: number;
  }> {
    let sent = 0;
    let failed = 0;
    
    // Get pending emails
    const emails = await prisma.email_queue.findMany({
      where: {
        status: 'pending',
        attempts: {
          lt: prisma.email_queue.fields.max_attempts,
        },
        OR: [
          { send_after: null },
          { send_after: { lte: new Date() } },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { created_at: 'asc' },
      ],
      take: 50, // Process 50 at a time
    });
    
    for (const email of emails) {
      try {
        // Update status
        await prisma.email_queue.update({
          where: { id: email.id },
          data: { status: 'sending' },
        });
        
        // Send email
        await this.send({
          to: email.recipient_email,
          subject: email.subject,
          html: email.body_html || undefined,
          text: email.body_text || undefined,
          template: email.template_name || undefined,
          data: email.template_data as any,
          attachments: email.attachments as any,
        });
        
        // Mark as sent
        await prisma.email_queue.update({
          where: { id: email.id },
          data: {
            status: 'sent',
            sent_at: new Date(),
          },
        });
        
        sent++;
        
      } catch (error: any) {
        logger.error(`Failed to send email ${email.id}`, error);
        
        // Update attempts
        await prisma.email_queue.update({
          where: { id: email.id },
          data: {
            status: email.attempts + 1 >= email.max_attempts ? 'failed' : 'pending',
            attempts: email.attempts + 1,
            last_error: error.message,
            last_attempt_at: new Date(),
          },
        });
        
        failed++;
      }
    }
    
    logger.info(`Email queue processed: ${sent} sent, ${failed} failed`);
    
    return { sent, failed };
  }
}

/**
 * Helper function to queue email
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  await EmailService.send(options);
}
```

---

## 9. Analytics Service

### 9.1 Analytics Service Implementation

```typescript
// src/services/analytics.service.ts
import { prisma } from '@/config/database.config';
import { redis } from '@/config/redis.config';

export class AnalyticsService {
  /**
   * Get dashboard analytics
   */
  static async getDashboard(
    userId: string,
    params: {
      county?: string;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<any> {
    // Get user to check permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      throw new Error('Unauthorized');
    }
    
    // Build cache key
    const cacheKey = `analytics:dashboard:${userId}:${JSON.stringify(params)}`;
    
    // Try cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Build where clause based on role
    const where: any = {
      status: 'completed',
      deleted_at: null,
    };
    
    if (params.county) {
      where.route = { county: params.county };
    } else if (user.role === 'la_admin' && user.county) {
      where.route = { county: user.county };
    }
    
    if (params.start_date || params.end_date) {
      where.audit_date = {};
      if (params.start_date) {
        where.audit_date.gte = new Date(params.start_date);
      }
      if (params.end_date) {
        where.audit_date.lte = new Date(params.end_date);
      }
    }
    
    // Summary stats
    const [
      totalAudits,
      totalIssues,
      criticalIssues,
      avgScore,
      routesAudited,
    ] = await Promise.all([
      prisma.audit.count({ where }),
      
      prisma.issue.count({
        where: {
          audit: where,
          deleted_at: null,
        },
      }),
      
      prisma.issue.count({
        where: {
          audit: where,
          severity: 'critical',
          deleted_at: null,
        },
      }),
      
      prisma.audit.aggregate({
        where,
        _avg: {
          normalized_score: true,
        },
      }),
      
      prisma.audit.findMany({
        where,
        distinct: ['route_id'],
        select: { route_id: true },
      }),
    ]);
    
    // Audits this month
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);
    
    const auditsThisMonth = await prisma.audit.count({
      where: {
        ...where,
        audit_date: { gte: thisMonthStart },
      },
    });
    
    // Trends (last 6 months)
    const trends = await this.getAuditTrends(where, 6);
    
    // Top issues
    const topIssues = await this.getTopIssueCategories(where);
    
    // By county
    const byCounty = await this.getAuditsByCounty(where);
    
    const result = {
      summary: {
        total_audits: totalAudits,
        total_issues: totalIssues,
        critical_issues: criticalIssues,
        audits_this_month: auditsThisMonth,
        avg_walkability_score: avgScore._avg.normalized_score,
        routes_audited: routesAudited.length,
      },
      trends,
      top_issues: topIssues,
      by_county: byCounty,
    };
    
    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(result));
    
    return result;
  }
  
  /**
   * Get audit trends over time
   */
  private static async getAuditTrends(
    where: any,
    months: number
  ): Promise<any[]> {
    const trends = await prisma.$queryRaw`
      SELECT
        TO_CHAR(audit_date, 'YYYY-MM') as month,
        COUNT(*)::INTEGER as count,
        ROUND(AVG(normalized_score)::NUMERIC, 2) as avg_score
      FROM audits
      WHERE 
        status = 'completed'
        AND deleted_at IS NULL
        AND audit_date >= CURRENT_DATE - INTERVAL '${months} months'
        ${where.route?.county ? prisma.Prisma.sql`AND route_id IN (SELECT id FROM routes WHERE county = ${where.route.county})` : prisma.Prisma.empty}
      GROUP BY TO_CHAR(audit_date, 'YYYY-MM')
      ORDER BY month ASC
    `;
    
    return trends as any;
  }
  
  /**
   * Get top issue categories
   */
  private static async getTopIssueCategories(where: any): Promise<any[]> {
    const topIssues = await prisma.issue.groupBy({
      by: ['category'],
      where: {
        audit: where,
        deleted_at: null,
      },
      _count: true,
      orderBy: {
        _count: {
          category: 'desc',
        },
      },
      take: 10,
    });
    
    const totalIssues = await prisma.issue.count({
      where: {
        audit: where,
        deleted_at: null,
      },
    });
    
    return topIssues.map((item) => ({
      category: item.category,
      count: item._count,
      percentage: ((item._count / totalIssues) * 100).toFixed(1),
    }));
  }
  
  /**
   * Get audits by county
   */
  private static async getAuditsByCounty(where: any): Promise<any[]> {
    const byCounty = await prisma.$queryRaw`
      SELECT
        r.county,
        COUNT(DISTINCT a.id)::INTEGER as audit_count,
        ROUND(AVG(a.normalized_score)::NUMERIC, 2) as avg_score
      FROM audits a
      JOIN routes r ON a.route_id = r.id
      WHERE
        a.status = 'completed'
        AND a.deleted_at IS NULL
      GROUP BY r.county
      ORDER BY audit_count DESC
    `;
    
    return byCounty as any;
  }
}
```

---

## 10. Background Jobs

### 10.1 Job Queue Setup

```typescript
// src/jobs/queue.ts
import Queue from 'bull';
import { logger } from '@/utils/logger.util';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create queues
export const pdfQueue = new Queue('pdf-generation', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const emailQueue = new Queue('email-sending', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const syncQueue = new Queue('sync-processing', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 10000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Queue a job
export async function queueJob(
  type: 'generate-pdf' | 'send-email' | 'process-sync',
  data: any,
  options?: any
): Promise<void> {
  switch (type) {
    case 'generate-pdf':
      await pdfQueue.add(data, options);
      break;
    case 'send-email':
      await emailQueue.add(data, options);
      break;
    case 'process-sync':
      await syncQueue.add(data, options);
      break;
  }
  
  logger.info(`Job queued: ${type}`, data);
}

// Error handling
pdfQueue.on('failed', (job, error) => {
  logger.error(`PDF job ${job.id} failed:`, error);
});

emailQueue.on('failed', (job, error) => {
  logger.error(`Email job ${job.id} failed:`, error);
});

syncQueue.on('failed', (job, error) => {
  logger.error(`Sync job ${job.id} failed:`, error);
});
```

### 10.2 PDF Generation Worker

```typescript
// src/jobs/pdf-generation.job.ts
import { pdfQueue } from './queue';
import { ReportService } from '@/services/report.service';
import { logger } from '@/utils/logger.util';

// Process PDF generation jobs
pdfQueue.process(async (job) => {
  const { auditId } = job.data;
  
  logger.info(`Processing PDF generation for audit ${auditId}`);
  
  try {
    const url = await ReportService.generatePDF(auditId);
    
    logger.info(`PDF generated: ${url}`);
    
    return { url };
  } catch (error) {
    logger.error(`PDF generation failed for audit ${auditId}`, error);
    throw error;
  }
});

export default pdfQueue;
```

### 10.3 Email Sender Worker

```typescript
// src/jobs/email-sender.job.ts
import { emailQueue } from './queue';
import { EmailService } from '@/services/email.service';
import { logger } from '@/utils/logger.util';

// Process email sending jobs
emailQueue.process(async (job) => {
  logger.info(`Processing email job ${job.id}`);
  
  try {
    await EmailService.processQueue();
    return { success: true };
  } catch (error) {
    logger.error('Email processing failed', error);
    throw error;
  }
});

// Run every minute
setInterval(async () => {
  await emailQueue.add({}, { jobId: `email-${Date.now()}` });
}, 60 * 1000);

export default emailQueue;
```

---

## Document Control

**Last Updated:** 2025-01-11  
**Next Review:** 2025-02-01

**Version History:**
- v1.0 (2025-01-11): Initial comprehensive backend services implementation

**Related Documents:**
- Part 1: Main PRD & Architecture
- Part 2: Database Complete Specification
- Part 3: API Complete Specification
- Part 4: Frontend Complete Implementation
- Part 6: Testing & DevOps

---

**END OF PART 5 (Backend Services Implementation)**
