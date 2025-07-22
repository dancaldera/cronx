# CronX - HTTP Automation Platform

A modern HTTP automation platform built with Next.js 15.x and Express.js in a pnpm monorepo. Schedule, monitor, and manage HTTP requests through CRON-based automation with comprehensive logging and real-time monitoring.

## 🏗️ Architecture

- **Frontend**: Next.js 15.x with App Router, React 19, Tailwind CSS 4.x
- **Backend**: Express.js with TypeScript, JWT authentication
- **Database**: PostgreSQL with Drizzle ORM, Redis for caching
- **Monorepo**: pnpm workspaces with centralized packages

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Docker and Docker Compose
- Git

### 1. Clone and Install

```bash
git clone <repository-url>
cd cronx
pnpm install
```

### 2. Environment Setup

```bash
# Copy environment templates
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Edit .env files with your preferred values
```

### 3. Start Development Environment

```bash
# Quick setup (recommended for first time)
pnpm setup

# Or manual setup
pnpm docker:up          # Start PostgreSQL & Redis
pnpm db:migrate         # Run database migrations
pnpm db:seed           # Seed with sample data
pnpm dev               # Start both web and API servers
```

### 4. Access the Application

- **Web App**: http://localhost:3000
- **API Server**: http://localhost:3001
- **API Health**: http://localhost:3001/api/health
- **Database Admin**: http://localhost:8080 (Adminer)
- **Redis Admin**: http://localhost:8081 (Redis Commander)

#### Database Connection Details

- **Host**: localhost:5433
- **Username**: postgres
- **Password**: postgres
- **Database**: cronx_dev

#### Redis Connection Details

- **Host**: localhost:6379
- **Password**: redis123
- **Database**: 0 (default)

## 📦 Development Commands

### Application Commands

```bash
pnpm dev              # Start both web and API in development
pnpm dev:web          # Start Next.js web app only
pnpm dev:api          # Start Express API server only
pnpm build            # Build both applications
pnpm test             # Run all tests
pnpm lint             # Lint all code
pnpm format           # Format code with Prettier
```

### Database Commands

```bash
pnpm db:generate      # Generate new Drizzle migrations
pnpm db:migrate       # Apply database migrations
pnpm db:studio        # Open Drizzle Studio (database GUI)
pnpm db:seed          # Seed database with sample data
pnpm db:reset         # Reset database and re-run migrations
```

### Docker Commands

```bash
pnpm docker:up        # Start PostgreSQL and Redis containers
pnpm docker:down      # Stop containers
pnpm docker:logs      # View container logs
pnpm docker:clean     # Stop containers and remove volumes
```

### Setup Commands

```bash
pnpm setup            # Complete setup: install, docker, migrate, seed
pnpm setup:clean      # Clean setup: remove volumes and start fresh
```

## 🗂️ Project Structure

```
cronx/
├── apps/
│   ├── web/                            # Next.js 15.x frontend
│   │   ├── app/                        # App Router pages
│   │   ├── components/                 # React components
│   │   └── lib/                        # Utilities and configurations
│   └── api/                            # Express.js backend
│       ├── src/
│       │   ├── controllers/            # Route handlers
│       │   ├── database/               # Database connection and models
│       │   │   ├── src/schemas/        # Drizzle ORM schemas
│       │   │   ├── src/utils/          # Database utilities
│       │   │   └── drizzle.config.ts   # Drizzle configuration
│       │   ├── middleware/             # Express middleware
│       │   ├── routes/                 # API routes
│       │   └── server.ts               # Application entry point
│       └── logs/                       # Application logs
├── packages/
│   ├── shared-types/                   # Shared TypeScript types
│   └── utils/                          # Shared utility functions
├── scripts/                            # Database and deployment scripts
├── docker-compose.yml                  # Local development services
└── pnpm-workspace.yaml                 # Workspace configuration
```

## 🔐 Environment Variables

### API Server (.env)

```bash
# Server
PORT=3001
NODE_ENV=development
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/cronx_dev
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123

# Authentication
JWT_SECRET=your-very-secure-secret-key
JWT_EXPIRES_IN=7d
```

### Web App (.env)

```bash
# API Connection
NEXT_PUBLIC_API_URL=http://localhost:3001

# Application
NODE_ENV=development
NEXT_PUBLIC_APP_NAME=CronX
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific app tests
pnpm test:web         # Frontend tests
pnpm test:api         # Backend tests

# Watch mode
pnpm test:web --watch
```

## 📊 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get user profile
- `PUT /api/auth/me` - Update user profile

### System

- `GET /api/health` - Health check with database status

### Coming Soon

- CRON job management (`/api/crons/*`)
- HTTP template management (`/api/http-templates/*`)
- Execution logs (`/api/cron-logs/*`)

## 🔧 Development Tools

### Database Management

- **Drizzle Studio**: `pnpm db:studio` - Visual database editor
- **Adminer**: http://localhost:8080 - Web-based database admin
- **Migrations**: Automatic schema versioning with Drizzle Kit

### Redis Management

- **Redis Commander**: http://localhost:8081 - Redis web interface
- **CLI Access**: `docker exec -it cronx-redis redis-cli -a redis123`
- **Direct Connection**: `redis-cli -h localhost -p 6379 -a redis123`

### Logging

- **API Logs**: `apps/api/logs/` directory
- **Container Logs**: `pnpm docker:logs`
- **Structured Logging**: Winston with JSON format

## 🚨 Troubleshooting

### Common Issues

**Database Connection Failed**

```bash
# Check if containers are running
docker ps

# Restart containers
pnpm docker:down && pnpm docker:up

# Check logs
pnpm docker:logs
```

**Port Already in Use**

```bash
# Check what's using the port
lsof -i :3001  # or :3000, :5432, :6379

# Kill the process or change ports in .env files
```

**Build Errors**

```bash
# Clean install
rm -rf node_modules */node_modules
pnpm install

# Build individual packages
pnpm build:api
pnpm build:web
```

**Database Migration Issues**

```bash
# Reset database completely
pnpm db:reset

# Generate new migration
pnpm db:generate

# Check migration status
pnpm db:studio
```

## 📚 Documentation

- [Product Requirements Document](./PRD.md)
- [Implementation Plan](./IMPLEMENTATION_PLAN.md)
- [Claude AI Guidance](./CLAUDE.md)

## 🤝 Contributing

1. Create a feature branch from `master`
2. Make your changes following the established patterns
3. Run tests and linting: `pnpm test && pnpm lint`
4. Update documentation if needed
5. Submit a pull request

## 📄 License

ISC License - See LICENSE file for details

