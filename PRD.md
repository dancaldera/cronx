# Product Requirements Document (PRD)
## HTTP Automation Platform with CRON Scheduling

**Document Version:** 1.1  
**Date:** July 20, 2025  
**Project:** HTTP Automation Platform  
**Tech Stack:** Next.js 15.x Web + Express.js API Monorepo  
**Repository Structure:** `apps/web/` + `apps/api/` in pnpm monorepo  
**Next Review Date:** August 20, 2025

---

## Executive Summary

A modern HTTP automation platform built with Next.js 15.x web interface and Express.js API server in a pnpm monorepo structure. The application provides developers and system administrators with a powerful interface to schedule, monitor, and manage HTTP requests through CRON-based automation with comprehensive logging and real-time monitoring capabilities.

---

## Product Overview

### Vision
Create a powerful and user-friendly HTTP automation platform that enables developers and system administrators to schedule, monitor, and manage HTTP requests through an intuitive CRON-based interface.

### Objectives
- Provide a reliable HTTP automation scheduling system
- Implement real-time execution monitoring and logging
- Offer flexible HTTP request templates and configurations
- Ensure high availability and execution reliability
- Deliver an excellent user experience for automation workflows

### Success Metrics
- CRON job execution success rate > 95%
- Page load time < 2 seconds
- 99.9% uptime
- User retention rate > 60% after 30 days
- Average setup time for new automation < 5 minutes

---

## Target Audience

### Primary Users
- **Developers & Automators** (22-50 years): Creating HTTP automation workflows
- **DevOps Engineers** (25-45 years): Monitoring services and automating responses
- **API Integrators** (24-40 years): Setting up webhooks and scheduled API calls
- **System Administrators** (28-50 years): Automating maintenance tasks

### User Personas
1. **Mike, Full-Stack Developer (28)**
   - Needs HTTP automation for API monitoring and webhooks
   - Values flexible cron scheduling and request templates
   - Requires detailed execution logs and error handling

2. **Sarah, DevOps Engineer (32)**
   - Automates deployment checks and health monitoring
   - Uses multiple environments and needs timezone-aware scheduling
   - Values real-time notifications and retry logic

3. **Alex, System Administrator (35)**
   - Sets up automated maintenance and monitoring tasks
   - Needs reliable scheduling with detailed logging
   - Prefers simple interface for complex automation workflows

---

## Functional Requirements

### Core Features (MVP)

#### 1. CRON Job Management
- **CRON Configuration**
  - Create scheduled HTTP requests with cron expressions
  - Support for standard cron format (minute hour day month weekday)
  - Timezone-aware scheduling
  - Visual cron expression builder

- **HTTP Request Templates**
  - Configurable HTTP methods (GET, POST, PUT, DELETE)
  - Custom headers and authentication
  - Request body templates with variables
  - Response validation rules

- **Execution Management**
  - Enable/disable CRON jobs
  - Manual execution for testing
  - Retry logic with configurable attempts
  - Timeout handling

- **Monitoring & Logging**
  - Execution history and logs
  - Success/failure statistics
  - Performance metrics
  - Real-time execution notifications

#### 2. HTTP Template Library
- **Template Creation**
  - Save and reuse HTTP request configurations
  - Variable substitution in URLs, headers, and body
  - Template versioning and history
  - Import/export functionality

- **Template Management**
  - Organize templates by categories or tags
  - Search and filter templates
  - Clone and modify existing templates
  - Share templates with team members

#### 3. Authentication & Security
- **Multiple Auth Types**
  - Bearer token authentication
  - Basic authentication
  - API key authentication
  - Custom header authentication

- **Security Features**
  - Encrypted credential storage
  - SSL certificate validation options
  - Request signing capabilities
  - IP whitelisting for webhooks

#### 4. User Interface
- **Responsive Design**
  - Mobile-first approach
  - Tablet and desktop optimized layouts
  - Touch-friendly interface elements

- **Theme Support**
  - Light and dark theme options
  - System theme auto-detection
  - User preference persistence

- **Accessibility**
  - Keyboard navigation support
  - Screen reader compatibility
  - High contrast mode support
  - ARIA labels and semantic HTML

---

## Technical Requirements

### Web Interface (Next.js 15.x)

#### Framework & Libraries
- **Next.js 15.x** - React framework with App Router and enhanced performance
- **React 19** - Latest React with concurrent features and improved hydration
- **Tailwind CSS 4.x** - Next-generation utility-first CSS framework
- **Zustand 4.x** - Lightweight state management with TypeScript support
- **TanStack Query v5** - Powerful data fetching and caching library
- **React Hook Form** - Performant forms with easy validation
- **Zod** - TypeScript-first schema validation
- **Framer Motion** - Production-ready motion library for React

#### Next.js 15.x Key Features
- **App Router (Stable)** with nested layouts and loading states
- **Server Components** for improved performance and SEO
- **Client Components** for interactive elements
- **Built-in TypeScript** with zero-configuration setup
- **Turbopack** for ultra-fast development and building
- **Edge Runtime** support for global performance
- **Streaming SSR** with React Suspense
- **Partial Prerendering (PPR)** for optimal loading
- **Enhanced Image Optimization** with `next/image`
- **Native ESM** support for better tree-shaking

#### Performance Requirements (Enhanced for Next.js 15.x)
- First Contentful Paint < 1.0s (improved with Server Components)
- Largest Contentful Paint < 1.8s (improved with PPR)
- Cumulative Layout Shift < 0.05 (improved with enhanced layouts)
- Bundle size < 250KB (improved with better tree-shaking)
- Lighthouse Performance Score > 95
- Time to Interactive < 2.0s
- Core Web Vitals optimization with automatic monitoring

### API Server (Express.js + TypeScript)

#### Framework & Libraries
- **Express.js** - Fast, unopinionated web framework for Node.js
- **TypeScript** - Type-safe JavaScript with enhanced developer experience
- **Drizzle ORM** - Modern TypeScript ORM with type safety
- **JSON Web Token** - JWT authentication implementation
- **bcrypt** - Password hashing and security
- **Redis** - In-memory cache and session store
- **node-cron** - Robust cron job scheduler for Node.js
- **axios** - Promise-based HTTP client for requests
- **zod** - TypeScript-first schema validation
- **winston** - Professional logging library

#### Architecture Patterns
- **RESTful API** design with consistent endpoints
- **Clean Architecture** with separation of concerns
- **Repository Pattern** for data access abstraction
- **Dependency Injection** for testability
- **Middleware Chain** for cross-cutting concerns
- **Event-Driven Architecture** for real-time updates
- **CRON Scheduler** with clustering support for horizontal scaling

#### Database & Caching
- **PostgreSQL** - Primary relational database
- **Drizzle ORM** - Type-safe database operations with centralized schemas in packages/database
- **Redis** - In-memory cache and session store
- **Database migrations** with Drizzle Kit in centralized package
- **Connection pooling** for optimal performance
- **Shared database layer** accessible from both web and API applications

#### Performance Requirements
- API response time < 200ms (95th percentile)
- Concurrent users: 1000+
- Database queries optimized with proper indexing
- Connection pooling for database efficiency
- Rate limiting to prevent abuse

### Infrastructure & DevOps

#### Development Environment
- **pnpm workspace** for monorepo management
- **Docker Compose** for local multi-service setup
- **nodemon** for Node.js hot reloading in development
- **Next.js dev server** with Fast Refresh for web interface
- **npm scripts** for consistent task execution
- **Environment configuration** with .env files

#### Production Deployment Options
- **Vercel** - Optimal deployment for Next.js with serverless functions
- **Railway/Render** - Quick deployment for both frontend and backend
- **VPS Deployment** - Traditional server setup with Docker and PM2
- **Cloud Platforms** - AWS ECS, GCP Cloud Run, Azure Container Instances
- **Kubernetes** - Enterprise-grade container orchestration

#### Monitoring & Observability
- **Health check endpoints** for service monitoring
- **Structured logging** with Winston
- **Metrics collection** (Prometheus compatible)
- **Error tracking** and alerting
- **Performance monitoring** and APM integration

---

## API Specifications

### Web Interface Routes (Next.js App Router)
```
/                              - Dashboard with CRON job overview
/dashboard                     - Main dashboard with statistics
/crons                         - CRON jobs management dashboard
/crons/create                  - Create new CRON job
/crons/[id]                    - CRON job detail and logs
/crons/[id]/edit               - Edit CRON job
/crons/[id]/logs               - Detailed execution logs
/http-templates                - HTTP request templates library
/http-templates/create         - Create new HTTP template
/http-templates/[id]           - Template detail view
/http-templates/[id]/edit      - Edit template
/http-templates/[id]/test      - Test template execution
/profile                       - User profile and settings
/settings                      - Application settings
/auth/login                    - User login page
/auth/register                 - User registration page
/auth/forgot-password          - Password reset page
```

### API Server Endpoints

#### Authentication
```
POST /api/auth/register        - User registration
POST /api/auth/login           - User login
POST /api/auth/logout          - User logout
POST /api/auth/refresh         - Token refresh
GET  /api/auth/me              - Get current user profile
PUT  /api/auth/me              - Update user profile
POST /api/auth/forgot-password - Request password reset
POST /api/auth/reset-password  - Reset password with token
```

#### CRON Jobs & HTTP Automation
```
GET    /api/crons                    - List user's CRON jobs
POST   /api/crons                    - Create new CRON job
GET    /api/crons/:id                - Get specific CRON job details
PUT    /api/crons/:id                - Update CRON job
DELETE /api/crons/:id                - Delete CRON job
PATCH  /api/crons/:id/enable         - Enable/disable CRON job
GET    /api/crons/:id/logs           - Get CRON execution logs
POST   /api/crons/:id/test           - Test CRON job execution
GET    /api/crons/:id/next-runs      - Get next scheduled executions
POST   /api/crons/bulk-enable        - Bulk enable/disable operations
GET    /api/crons/stats              - Get CRON jobs statistics
```

#### HTTP Request Templates
```
GET    /api/http-templates           - List HTTP request templates
POST   /api/http-templates           - Create new HTTP template
GET    /api/http-templates/:id       - Get specific template
PUT    /api/http-templates/:id       - Update template
DELETE /api/http-templates/:id       - Delete template
POST   /api/http-templates/:id/test  - Test HTTP template execution
POST   /api/http-templates/:id/clone - Clone existing template
GET    /api/http-templates/search    - Search templates by name/tags
POST   /api/http-templates/import    - Import template from file
GET    /api/http-templates/export    - Export templates
```

#### CRON Execution Logs
```
GET    /api/cron-logs               - List execution logs (with filters)
GET    /api/cron-logs/:id           - Get specific log entry
DELETE /api/cron-logs/:id           - Delete log entry
POST   /api/cron-logs/cleanup       - Cleanup old logs (admin)
GET    /api/cron-logs/export        - Export logs to CSV/JSON
GET    /api/cron-logs/stats         - Get execution statistics
```

#### Dashboard & Analytics
```
GET    /api/dashboard               - Dashboard overview data
GET    /api/analytics/executions   - Execution analytics
GET    /api/analytics/performance  - Performance metrics
GET    /api/analytics/trends        - Execution trends over time
GET    /api/analytics/errors        - Error analysis and patterns
```

#### System & Health
```
GET    /api/health                   - API health check
GET    /api/version                  - API version info
GET    /api/metrics                  - System metrics (admin only)
GET    /api/scheduler/status         - CRON scheduler status
```

### Real-Time Updates

```
Server-Sent Events /api/sse/crons    - Real-time CRON job updates
Events:
  - cron_created      - New CRON job created
  - cron_updated      - CRON job modified
  - cron_executed     - CRON job executed
  - cron_failed       - CRON job execution failed
  - cron_enabled      - CRON job enabled/disabled
  - cron_deleted      - CRON job removed

Server-Sent Events /api/sse/templates - Real-time template updates
Events:
  - template_created  - New HTTP template created
  - template_updated  - Template modified
  - template_deleted  - Template removed
  - template_tested   - Template test executed

Server-Sent Events /api/sse/logs     - Real-time execution updates
Events:
  - execution_started - CRON execution started
  - execution_completed - Execution finished
  - execution_failed  - Execution failed
  - log_created       - New log entry
```

---

## Data Models

### User Model
```json
{
  "id": "uuid",
  "email": "string (unique, indexed)",
  "username": "string (unique, indexed)",
  "password_hash": "string",
  "first_name": "string",
  "last_name": "string",
  "avatar_url": "string|null",
  "bio": "text|null",
  "theme_preference": "light|dark|system",
  "timezone": "string",
  "date_format": "string",
  "time_format": "12h|24h",
  "language": "string",
  "email_notifications": "boolean",
  "push_notifications": "boolean",
  "is_active": "boolean",
  "is_verified": "boolean",
  "last_active": "timestamp",
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "deleted_at": "timestamp|null"
}
```

### CRON Job Model
```json
{
  "id": "uuid",
  "user_id": "uuid (foreign key, indexed)",
  "name": "string",
  "description": "text|null",
  "cron_expression": "string",
  "timezone": "string",
  "http_template_id": "uuid (foreign key)",
  "is_enabled": "boolean",
  "retry_attempts": "integer",
  "timeout_seconds": "integer",
  "last_execution": "timestamp|null",
  "next_execution": "timestamp|null",
  "execution_count": "integer",
  "success_count": "integer",
  "failure_count": "integer",
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "deleted_at": "timestamp|null"
}
```

### HTTP Template Model
```json
{
  "id": "uuid",
  "user_id": "uuid (foreign key, indexed)",
  "name": "string",
  "description": "text|null",
  "method": "GET|POST|PUT|DELETE|PATCH",
  "url": "string",
  "headers": "json",
  "body": "text|null",
  "auth_type": "none|bearer|basic|api_key",
  "auth_config": "json|null",
  "timeout_seconds": "integer",
  "follow_redirects": "boolean",
  "validate_ssl": "boolean",
  "expected_status_codes": "array<integer>",
  "response_validation": "json|null",
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "deleted_at": "timestamp|null"
}
```

### CRON Execution Log Model
```json
{
  "id": "uuid",
  "cron_job_id": "uuid (foreign key, indexed)",
  "execution_time": "timestamp",
  "status": "success|failure|timeout",
  "response_status": "integer|null",
  "response_body": "text|null",
  "response_headers": "json|null",
  "execution_duration": "integer (milliseconds)",
  "error_message": "text|null",
  "retry_attempt": "integer",
  "created_at": "timestamp"
}
```

### Dashboard Analytics Model
```json
{
  "id": "uuid",
  "user_id": "uuid (foreign key, indexed)",
  "date": "date (indexed)",
  "total_executions": "integer",
  "successful_executions": "integer",
  "failed_executions": "integer",
  "average_response_time": "float (milliseconds)",
  "total_cron_jobs": "integer",
  "active_cron_jobs": "integer",
  "most_active_hour": "integer|null",
  "success_rate": "float",
  "created_at": "timestamp"
}
```

---

## User Experience Requirements

### User Flows

#### 1. New User Onboarding
1. User visits application
2. Registration form with email/password
3. Email verification (optional)
4. Welcome screen with quick tutorial
5. Create first HTTP template prompt
6. Dashboard with sample data

#### 2. Daily CRON Management
1. User opens application
2. View dashboard with execution overview
3. Quick create new CRON job
4. Monitor execution status
5. Review execution logs
6. Adjust schedules as needed

#### 3. CRON Job Automation Flow
1. User creates HTTP request template
2. User configures CRON schedule with timezone
3. System validates CRON expression and target URL
4. CRON job gets scheduled in background scheduler
5. At scheduled time, system executes HTTP request
6. Response gets logged with status and metrics
7. User receives real-time notification of execution
8. Failure triggers retry logic if configured

#### 4. Template Management
1. Create reusable HTTP templates
2. Organize templates by tags/categories
3. Test templates before scheduling
4. Clone and modify existing templates
5. Share templates with team members

### Design Principles
- **Simplicity** - Clean, uncluttered interface
- **Efficiency** - Minimal clicks to complete actions
- **Consistency** - Uniform design patterns
- **Accessibility** - Inclusive design for all users

### Visual Design
- **Typography** - Clear, readable fonts (Inter/Roboto)
- **Color Palette** - Professional blues and greens with accent colors
- **Spacing** - Generous whitespace for clarity
- **Icons** - Consistent icon library (Heroicons/Lucide)

### Interaction Design
- **Hover States** - Clear feedback on interactive elements
- **Loading States** - Skeleton loaders and progress indicators
- **Error States** - Helpful error messages with recovery options
- **Empty States** - Engaging empty state illustrations

---

## Security Requirements

### Authentication & Authorization
- **JWT-based authentication** with refresh tokens
- **Password hashing** using bcrypt with salt
- **Rate limiting** on authentication endpoints
- **Session management** with secure cookies

### Data Protection
- **Input validation** and sanitization
- **SQL injection prevention** via parameterized queries
- **XSS protection** with content security policies
- **CSRF protection** with tokens

### Privacy & Compliance
- **Data encryption** at rest and in transit
- **GDPR compliance** with data export/deletion
- **User consent** for data collection
- **Audit logging** for security events

---

## Performance Requirements

### Frontend Performance
- **Time to Interactive** < 2 seconds
- **Bundle size** optimization with code splitting
- **Image optimization** with WebP format
- **Caching strategy** for static assets

### Backend Performance
- **Response time** < 200ms for 95% of requests
- **Throughput** 1000+ requests per second
- **Database optimization** with proper indexing
- **Connection pooling** for database efficiency

### Scalability
- **Horizontal scaling** support
- **Database read replicas** for read-heavy operations
- **CDN integration** for global content delivery
- **Load balancing** for high availability

---

## Testing Requirements

### Web Interface Testing (Next.js 15.x)
- **Unit Tests** - React component testing with Jest and React Testing Library
- **Component Tests** - Testing user interactions with Next.js Test Utils
- **Integration Tests** - API integration testing with MSW (Mock Service Worker)
- **E2E Tests** - End-to-end user journey testing with Playwright
- **Accessibility Tests** - a11y compliance testing with axe-core
- **Visual Regression Tests** - UI consistency with Percy or Chromatic
- **Performance Tests** - Core Web Vitals monitoring with Lighthouse CI
- **Type Tests** - TypeScript type testing with tsd or expect-type

### API Server Testing
- **Unit Tests** - Jest with TypeScript support and supertest for API testing
- **Integration Tests** - Database and HTTP API testing with test containers
- **Load Tests** - Performance and stress testing with Artillery or k6
- **Security Tests** - Vulnerability scanning with OWASP ZAP
- **Contract Tests** - API contract validation with Pact
- **Type Tests** - TypeScript type testing with tsd or expect-type

### Test Coverage
- **Minimum 80%** code coverage for critical paths
- **Automated testing** in CI/CD pipeline
- **Manual testing** for user experience validation

---

## Deployment & DevOps

### Development Environment Setup
- **pnpm workspace** with `apps/web/` and `apps/api/` structure
- **Docker Compose** for local multi-service development
- **nodemon** for Node.js hot reloading during development
- **Next.js dev server** with Fast Refresh for web interface
- **npm scripts** for consistent development workflow
- **Environment variables** management with .env files
- **Database seeding** with realistic sample data for development

### Deployment Strategies
- **Vercel** - Optimal deployment for Next.js with serverless functions
- **Railway/Render** - Quick deployment for both frontend and backend
- **VPS Deployment** - Traditional server setup with Docker and PM2
- **Cloud Platforms** - AWS ECS, GCP Cloud Run, Azure Container Instances
- **Kubernetes** - Enterprise-grade container orchestration

### Production Environment Requirements
- **PM2** for Node.js process management and clustering
- **Database connection pooling** and read replicas for scaling
- **Redis caching** for session management and frequently accessed data
- **Load balancing** with SSL termination and automatic scaling
- **Database backups** with automated point-in-time recovery
- **Monitoring and alerting** with Prometheus, Grafana, and Sentry
- **CI/CD pipelines** with automated testing and deployment

---

## Success Criteria & KPIs

### User Engagement
- **Daily Active Users** (DAU) growth
- **CRON execution success rate** > 95%
- **Session duration** average > 8 minutes
- **User retention** > 60% after 30 days

### Technical Performance
- **Uptime** > 99.9%
- **Page load time** < 2 seconds
- **API response time** < 200ms (95th percentile)
- **Error rate** < 1%

### Business Metrics
- **User acquisition** rate
- **Feature adoption** rates
- **Support ticket** volume
- **User satisfaction** score > 4.5/5

---

## Risks & Mitigation

### Technical Risks
- **Database performance** - Implement caching and optimization
- **Scalability issues** - Design for horizontal scaling
- **Security vulnerabilities** - Regular security audits
- **Third-party dependencies** - Monitor and update regularly

### Business Risks
- **User adoption** - Focus on UX and user feedback
- **Competition** - Continuous feature development
- **Data loss** - Robust backup and recovery procedures
- **Compliance issues** - Stay updated with regulations

---

## Timeline & Milestones

### Phase 1: Core CRON Platform (6 weeks)
- **Week 1-2**: Monorepo setup, authentication system, and basic API structure
- **Week 3-4**: CRON job management system and HTTP request templates
- **Week 5-6**: Next.js web interface implementation with Server Components

### Phase 2: Advanced Features (4 weeks)
- **Week 7-8**: CRON execution monitoring and logging system
- **Week 9-10**: Real-time updates with Server-Sent Events and dashboard analytics

### Phase 3: Polish & Production (2 weeks)
- **Week 11-12**: Final testing, deployment setup, and production readiness

---

## Appendices

### A. Technology Stack Details
- **Web Interface**: Next.js 15.x, React 19, Tailwind CSS 4.x, Zustand, TanStack Query
- **API Server**: Node.js, Express.js, TypeScript, Drizzle ORM, PostgreSQL, Redis
- **DevOps**: Docker, Docker Compose, PM2, Kubernetes, GitHub Actions
- **Monorepo**: pnpm workspace with shared packages and utilities
- **Monitoring**: Prometheus, Grafana, Sentry, Winston logging
- **Development**: npm scripts, hot reloading, environment configuration

### B. Monorepo Structure Details
```
cronx/
├── apps/
│   ├── web/                     # Next.js 15.x web application
│   │   ├── app/                 # App Router directory
│   │   │   ├── layout.tsx       # Root layout
│   │   │   ├── page.tsx         # Dashboard page
│   │   │   ├── crons/           # CRON management pages
│   │   │   ├── http-templates/  # Template management pages
│   │   │   └── dashboard/       # Dashboard and analytics
│   │   ├── components/          # Reusable React components
│   │   ├── lib/                 # Utility functions and configurations
│   │   ├── stores/              # Zustand stores
│   │   ├── next.config.js       # Next.js configuration
│   │   └── package.json         # Web dependencies
│   │
│   └── api/                     # Express.js API server
│       ├── src/
│       │   ├── controllers/     # Route controllers
│       │   ├── services/        # Business logic
│       │   ├── middleware/      # Express middleware
│       │   ├── routes/          # API route definitions
│       │   ├── cron/            # CRON job scheduler
│       │   ├── utils/           # Utility functions
│       │   ├── config/          # Configuration files
│       │   └── server.ts        # Application entry point
│       ├── tests/               # API tests
│       ├── tsconfig.json        # TypeScript configuration
│       └── package.json         # API dependencies
│
├── packages/                    # Shared packages
│   ├── database/                # Centralized database layer
│   │   ├── src/
│   │   │   ├── schemas/         # Drizzle schema definitions
│   │   │   ├── migrations/      # Database migrations
│   │   │   ├── utils/           # Database utilities and connections
│   │   │   ├── seeds/           # Database seeding scripts
│   │   │   └── index.ts         # Package exports
│   │   ├── drizzle.config.ts    # Drizzle configuration
│   │   ├── tsconfig.json        # TypeScript configuration
│   │   └── package.json         # Database package dependencies
│   ├── shared-types/            # Shared TypeScript types
│   ├── utils/                   # Shared utility functions
│   ├── eslint-config/           # Shared ESLint configuration
│   └── tsconfig/                # Shared TypeScript configs
│
├── scripts/                     # Build and deployment scripts
├── k8s/                         # Kubernetes manifests
├── docker-compose.yml           # Local development setup
├── pnpm-workspace.yaml          # pnpm workspace configuration
├── package.json                 # Root package.json
└── .github/workflows/           # CI/CD pipelines
```

### C. Development Workflow
```bash
# Initial setup
pnpm install                 # Install all dependencies for workspace
pnpm dev                     # Start full development environment

# Development commands
pnpm dev:web                 # Start Next.js web interface only
pnpm dev:api                 # Start Express API server only
pnpm dev:watch               # Start both with auto-reload

# Testing and quality
pnpm test                    # Run all tests across workspace
pnpm test:web                # Run web interface tests
pnpm test:api                # Run API server tests
pnpm lint                    # Run code linting across workspace
pnpm format                  # Format code with Prettier

# Database operations
pnpm db:generate             # Generate Drizzle migrations (from packages/database)
pnpm db:migrate              # Run database migrations
pnpm db:studio               # Open Drizzle Studio
pnpm db:seed                 # Seed database with sample data
pnpm db:reset                # Reset database and re-run migrations

# CRON management
pnpm cron:status             # Check CRON scheduler status
pnpm cron:logs               # View recent CRON execution logs

# Build and deployment
pnpm build                   # Build all applications
pnpm build:web               # Build web application only
pnpm build:api               # Build API server only
pnpm deploy                  # Deploy to production
```

---

**Document Approval:**
- Product Manager: [Name]
- Engineering Lead: [Name]
- Design Lead: [Name]
- QA Lead: [Name]
