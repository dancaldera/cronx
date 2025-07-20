# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CronX is an HTTP Automation Platform with CRON Scheduling built as a Next.js 15.x + Express.js monorepo. The project provides developers and system administrators with a powerful interface to schedule, monitor, and manage HTTP requests through CRON-based automation with comprehensive logging and real-time monitoring.

**Current Status:** Planning phase complete, implementation in progress following the 85-task roadmap in `IMPLEMENTATION_PLAN.md`.

## Architecture & Tech Stack

### Monorepo Structure
```
cronx/
├── apps/
│   ├── web/          # Next.js 15.x frontend (App Router, React 19, Tailwind CSS 4.x)
│   └── api/          # Express.js backend (business logic, controllers, routes)
├── packages/
│   ├── database/     # Drizzle ORM schemas, migrations, and database utilities
│   ├── shared-types/ # Shared TypeScript types
│   └── utils/        # Shared utility functions
├── docker-compose.yml
└── pnpm-workspace.yaml
```

### Key Technologies
- **Frontend:** Next.js 15.x with App Router, Server Components, Zustand state management, TanStack Query v5
- **Backend:** Express.js with TypeScript, Drizzle ORM, PostgreSQL, Redis, node-cron scheduler
- **Development:** pnpm workspaces, Docker Compose, comprehensive testing strategy

## Development Commands

### Core Development
```bash
pnpm dev                     # Start both web and API in development
pnpm dev:web                 # Start Next.js web interface only
pnpm dev:api                 # Start Express API server only
```

### Database Operations
```bash
pnpm db:generate             # Generate Drizzle migrations (from packages/database)
pnpm db:migrate              # Run database migrations
pnpm db:studio               # Open Drizzle Studio for database management
pnpm db:seed                 # Seed database with sample data
pnpm db:reset                # Reset database and re-run migrations
```

### Testing
```bash
pnpm test                    # Run all tests across workspace
pnpm test:web                # Run Next.js component and integration tests
pnpm test:api                # Run API server tests
pnpm test:e2e                # Run end-to-end tests with Playwright
```

### Quality & Build
```bash
pnpm lint                    # Run ESLint across workspace
pnpm format                  # Format code with Prettier
pnpm build                   # Build both applications for production
```

## Core Domain Models

### CRON Job Management
- **CRON Jobs:** Scheduled HTTP requests with timezone awareness, retry logic, and execution tracking
- **HTTP Templates:** Reusable request configurations with authentication, headers, and validation rules
- **Execution Logs:** Detailed execution history with performance metrics and error tracking

### Key Features
- Visual CRON expression builder with timezone support
- Multiple authentication types (Bearer, Basic, API Key, Custom Headers)
- Real-time execution monitoring with Server-Sent Events
- Dashboard analytics with success rates and performance metrics
- Template library with categorization and sharing capabilities

## API Architecture

### RESTful Endpoints
- `/api/auth/*` - JWT-based authentication with refresh tokens
- `/api/crons/*` - CRON job CRUD operations and execution management
- `/api/http-templates/*` - HTTP template management and testing
- `/api/cron-logs/*` - Execution logs and analytics
- `/api/sse/*` - Real-time updates via Server-Sent Events

### Data Access Patterns
- Centralized database layer in `packages/database` with Drizzle ORM schemas and migrations
- Repository pattern for type-safe database operations shared across apps
- Clean architecture with service layer separation in API app
- Event-driven updates for real-time notifications
- Redis caching for session management and frequently accessed data

## Development Standards

### Code Organization
- Use TypeScript strict mode throughout
- Follow Next.js 15.x App Router conventions with Server/Client Components
- Implement clean architecture with clear separation between controllers, services, and data layers
- Use Zod for runtime validation on both frontend and backend

### Database Management
- All schemas and migrations centralized in `packages/database`
- Drizzle configuration and connection utilities in database package
- Use proper indexing for foreign keys and frequently queried fields
- Implement soft deletes with `deleted_at` timestamps
- Follow consistent naming conventions (snake_case for DB, camelCase for TypeScript)
- Import database schemas and utilities from `@cronx/database` package

### Security Implementation
- JWT authentication with secure refresh token rotation
- Input validation and sanitization on all endpoints
- Rate limiting on authentication and API endpoints
- Encrypted credential storage for HTTP template authentication

## Testing Strategy

### Coverage Requirements
- Minimum 80% code coverage for critical paths
- Unit tests for React components with React Testing Library
- Integration tests for API endpoints with supertest
- E2E tests for complete user flows with Playwright
- Load testing for CRON scheduler performance

### Test Organization
- `apps/web/tests/` for frontend tests
- `apps/api/tests/` for backend tests
- Shared test utilities in `packages/test-utils/`

## Performance Requirements

### Frontend Targets
- First Contentful Paint < 1.0s (leveraging Server Components)
- Largest Contentful Paint < 1.8s (with Partial Prerendering)
- Lighthouse Performance Score > 95
- Bundle size < 250KB with proper code splitting

### Backend Targets
- API response time < 200ms (95th percentile)
- Support 1000+ concurrent users
- CRON execution success rate > 95%
- Database query optimization with proper indexing

## Implementation Progress

Reference `IMPLEMENTATION_PLAN.md` for the complete 85-task roadmap organized in 6 phases:
1. **Phase 1:** Core Foundation (Weeks 1-2) - ✅ COMPLETED
2. **Phase 2:** Authentication & API (Weeks 3-4)
3. **Phase 3:** CRON Management (Weeks 5-6)
4. **Phase 4:** Web Interface (Weeks 7-8)
5. **Phase 5:** Advanced Features (Weeks 9-10)
6. **Phase 6:** Testing & Deployment (Weeks 11-12)

**IMPORTANT:** When completing tasks, always update the `IMPLEMENTATION_PLAN.md` file by:
1. Marking completed tasks with `[x]` instead of `[ ]`
2. Updating the phase progress counters at the top
3. Updating the total progress counter
4. This ensures accurate tracking and helps future Claude instances understand project status