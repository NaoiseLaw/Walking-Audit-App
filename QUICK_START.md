# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites Check
```bash
node --version  # Should be >= 20.0.0
npm --version   # Should be >= 10.0.0
docker --version  # Optional, for containerized setup
```

### Option 1: Docker (Recommended)
```bash
# 1. Clone the repository
git clone <repository-url>
cd walking-audit-app

# 2. Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Start all services
docker-compose up -d

# 4. Run database migrations
docker-compose exec backend npm run db:migrate
docker-compose exec backend npm run db:seed

# 5. Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

### Option 2: Local Development
```bash
# 1. Clone the repository
git clone <repository-url>
cd walking-audit-app

# 2. Install dependencies
npm install

# 3. Set up PostgreSQL and Redis
# Install PostgreSQL 16 with PostGIS 3.4
# Install Redis 7.x

# 4. Create database
createdb walkingaudit
psql walkingaudit -c "CREATE EXTENSION postgis;"
psql walkingaudit -c "CREATE EXTENSION \"uuid-ossp\";"
psql walkingaudit -c "CREATE EXTENSION pg_trgm;"

# 5. Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files with your configuration

# 6. Set up backend
cd backend
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev

# 7. Set up frontend (in a new terminal)
cd frontend
npm install
npm run dev

# 8. Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

## 📁 Project Structure

```
walking-audit-app/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   └── server.ts       # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Database seed
│   └── package.json
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js App Router
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities
│   │   ├── store/         # Redux store
│   │   └── types/         # TypeScript types
│   └── package.json
└── package.json           # Root workspace config
```

## 🔑 Default Credentials

After running `npm run db:seed`, you can use these test accounts:

- **Admin**: admin@walkingaudit.ie / admin123
- **Coordinator**: coordinator@walkingaudit.ie / coordinator123
- **Auditor**: auditor@walkingaudit.ie / auditor123

## 🛠️ Common Commands

### Backend
```bash
cd backend

# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate      # Generate Prisma Client
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage

# Code Quality
npm run lint             # Lint code
npm run lint:fix         # Fix linting issues
npm run type-check       # Type check
```

### Frontend
```bash
cd frontend

# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:e2e         # Run E2E tests

# Code Quality
npm run lint             # Lint code
npm run type-check       # Type check
```

### Root
```bash
# Run all services
npm run dev              # Start both backend and frontend

# Run all tests
npm test                 # Run all tests

# Run all linters
npm run lint             # Lint all code
```

## 📚 Key Files

### Backend
- `backend/src/server.ts` - Server entry point
- `backend/src/app.ts` - Express app configuration
- `backend/prisma/schema.prisma` - Database schema
- `backend/src/services/auth.service.ts` - Authentication service
- `backend/src/routes/*.routes.ts` - API routes
- `backend/src/controllers/*.controller.ts` - Route controllers

### Frontend
- `frontend/src/app/layout.tsx` - Root layout
- `frontend/src/app/page.tsx` - Home page
- `frontend/src/store/index.ts` - Redux store
- `frontend/src/lib/api.ts` - API client
- `frontend/src/types/index.ts` - TypeScript types

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_isready

# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

### Redis Connection Issues
```bash
# Check Redis is running
redis-cli ping

# Check Redis URL
echo $REDIS_URL
```

### Port Already in Use
```bash
# Find process using port
lsof -i :3001  # Backend
lsof -i :3000  # Frontend

# Kill process
kill -9 <PID>
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Prisma Client Issues
```bash
# Regenerate Prisma Client
cd backend
npm run db:generate
```

## 📖 Next Steps

1. **Read the Documentation**
   - `README.md` - Project overview
   - `SETUP.md` - Detailed setup instructions
   - `PROJECT_STATUS.md` - Implementation status
   - `IMPLEMENTATION_SUMMARY.md` - What's been implemented

2. **Explore the Code**
   - Start with `backend/src/server.ts`
   - Check out `backend/src/services/auth.service.ts`
   - Look at `frontend/src/store/index.ts`

3. **Run the Application**
   - Start the backend: `cd backend && npm run dev`
   - Start the frontend: `cd frontend && npm run dev`
   - Visit http://localhost:3000

4. **Make Your First Change**
   - Create a new API endpoint
   - Add a new React component
   - Update the database schema

## 🔗 Useful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 💡 Tips

- Use `npm run db:studio` to visualize your database
- Use `npm run type-check` to catch TypeScript errors
- Use `npm run lint` to check code quality
- Use Docker for consistent development environment
- Check `PROJECT_STATUS.md` for implementation progress

## 🆘 Need Help?

- Check the documentation in `Mum App Markdown Files/`
- Review the implementation status in `PROJECT_STATUS.md`
- Check the setup guide in `SETUP.md`
- Review the code comments for guidance

---

**Happy Coding! 🎉**

