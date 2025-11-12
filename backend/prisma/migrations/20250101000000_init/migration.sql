-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('auditor', 'coordinator', 'la_admin', 'system_admin');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('draft', 'in_progress', 'completed', 'reviewed', 'archived');

-- CreateEnum
CREATE TYPE "SectionName" AS ENUM ('footpaths', 'facilities', 'crossing_road', 'road_user_behaviour', 'safety', 'look_and_feel', 'school_gates');

-- CreateEnum
CREATE TYPE "AbilityType" AS ENUM ('wheelchair_user', 'reduced_mobility', 'blind_low_vision', 'deaf_hearing_loss', 'cognitive_difficulties', 'buggy_stroller', 'young_child', 'carer', 'none');

-- CreateEnum
CREATE TYPE "IssueCategory" AS ENUM ('footpath', 'crossing', 'obstacle', 'safety', 'lighting', 'signage', 'facility', 'traffic', 'accessibility', 'maintenance', 'other');

-- CreateEnum
CREATE TYPE "IssueSeverity" AS ENUM ('low', 'medium', 'high', 'critical');

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- This migration file is a placeholder
-- Prisma will generate the actual migration SQL based on schema.prisma
-- Run: npx prisma migrate dev

