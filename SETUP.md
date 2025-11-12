# Setup Guide

This guide will help you set up the Walking Audit App development environment.

## Prerequisites

- Node.js 20 LTS or higher
- npm 10 or higher
- PostgreSQL 16 with PostGIS 3.4
- Redis 7.x
- Docker (optional, for containerized setup)

## Quick Start with Docker

1. Clone the repository
2. Copy environment files:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
3. Start services:
   ```bash
   docker-compose up -d
   ```
4. Run database migrations:
   ```bash
   cd backend
   npm run db:migrate
   npm run db:seed
   ```
5. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Manual Setup

### 1. Database Setup

1. Install PostgreSQL 16 with PostGIS 3.4
2. Create database:
   ```sql
   CREATE DATABASE walkingaudit;
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   ```

### 2. Redis Setup

1. Install Redis 7.x
2. Start Redis server:
   ```bash
   redis-server
   ```

### 3. Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment file:
   ```bash
   cp .env.example .env
   ```
4. Update `.env` with your configuration
5. Generate Prisma Client:
   ```bash
   npm run db:generate
   ```
6. Run database migrations:
   ```bash
   npm run db:migrate
   ```
7. Seed database:
   ```bash
   npm run db:seed
   ```
8. Start development server:
   ```bash
   npm run dev
   ```

### 4. Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment file:
   ```bash
   cp .env.example .env
   ```
4. Update `.env` with your configuration
5. Start development server:
   ```bash
   npm run dev
   ```

## Environment Variables

### Backend (.env)

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens

Optional variables:
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `GOOGLE_MAPS_API_KEY` - Google Maps API key
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `SENDGRID_API_KEY` - SendGrid API key for emails

### Frontend (.env)

Required variables:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key

## Database Migrations

### Create a new migration:
```bash
cd backend
npm run db:migrate
```

### Reset database:
```bash
cd backend
npm run db:reset
```

### View database:
```bash
cd backend
npm run db:studio
```

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### E2E Tests
```bash
cd frontend
npm run test:e2e
```

## Development Workflow

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Commit your changes
5. Push to remote
6. Create a pull request

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Verify PostGIS extension is installed

### Redis Connection Issues
- Verify Redis is running
- Check REDIS_URL in .env
- Test connection: `redis-cli ping`

### Port Already in Use
- Change PORT in .env
- Kill process using the port
- Use different ports for backend/frontend

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

