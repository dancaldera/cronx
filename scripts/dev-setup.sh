#!/bin/bash
# CronX Development Environment Setup Script

set -e

echo "🚀 Setting up CronX development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_requirements() {
    echo -e "${BLUE}Checking requirements...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ and try again.${NC}"
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        echo -e "${RED}❌ pnpm is not installed. Installing pnpm...${NC}"
        npm install -g pnpm
    fi
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed. Please install Docker and try again.${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose and try again.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All requirements satisfied${NC}"
}

# Setup environment files
setup_env() {
    echo -e "${BLUE}Setting up environment files...${NC}"
    
    if [ ! -f .env ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created root .env file${NC}"
    else
        echo -e "${YELLOW}⚠️  Root .env file already exists${NC}"
    fi
    
    if [ ! -f apps/api/.env ]; then
        cp apps/api/.env.example apps/api/.env
        echo -e "${GREEN}✅ Created API .env file${NC}"
    else
        echo -e "${YELLOW}⚠️  API .env file already exists${NC}"
    fi
    
    if [ ! -f apps/web/.env ]; then
        cp apps/web/.env.example apps/web/.env
        echo -e "${GREEN}✅ Created Web .env file${NC}"
    else
        echo -e "${YELLOW}⚠️  Web .env file already exists${NC}"
    fi
}

# Install dependencies
install_deps() {
    echo -e "${BLUE}Installing dependencies...${NC}"
    pnpm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Start Docker services
start_docker() {
    echo -e "${BLUE}Starting Docker services...${NC}"
    docker-compose up -d
    
    echo -e "${BLUE}Waiting for services to be ready...${NC}"
    sleep 10
    
    # Check if PostgreSQL is ready
    until docker exec cronx-postgres pg_isready -U postgres; do
        echo -e "${YELLOW}⏳ Waiting for PostgreSQL...${NC}"
        sleep 2
    done
    
    # Check if Redis is ready  
    until docker exec cronx-redis redis-cli ping; do
        echo -e "${YELLOW}⏳ Waiting for Redis...${NC}"
        sleep 2
    done
    
    echo -e "${GREEN}✅ Docker services are ready${NC}"
}

# Setup database
setup_database() {
    echo -e "${BLUE}Setting up database...${NC}"
    
    echo -e "${BLUE}Running migrations...${NC}"
    pnpm db:migrate
    
    echo -e "${BLUE}Seeding database...${NC}"
    pnpm db:seed
    
    echo -e "${GREEN}✅ Database setup complete${NC}"
}

# Build packages
build_packages() {
    echo -e "${BLUE}Building packages...${NC}"
    pnpm build
    echo -e "${GREEN}✅ Packages built successfully${NC}"
}

# Main setup function
main() {
    echo -e "${GREEN}🎯 CronX Development Setup${NC}"
    echo -e "${BLUE}This script will set up your local development environment.${NC}"
    echo ""
    
    check_requirements
    setup_env
    install_deps
    start_docker
    setup_database
    build_packages
    
    echo ""
    echo -e "${GREEN}🎉 Setup complete! Your development environment is ready.${NC}"
    echo ""
    echo -e "${BLUE}Quick commands:${NC}"
    echo -e "  ${YELLOW}pnpm dev${NC}           # Start both web and API servers"
    echo -e "  ${YELLOW}pnpm dev:web${NC}       # Start web app only (http://localhost:3000)"
    echo -e "  ${YELLOW}pnpm dev:api${NC}       # Start API server only (http://localhost:3001)"
    echo -e "  ${YELLOW}pnpm db:studio${NC}     # Open database management UI"
    echo ""
    echo -e "${BLUE}Management interfaces:${NC}"
    echo -e "  ${YELLOW}http://localhost:8080${NC}  # Database Admin (Adminer)"
    echo -e "  ${YELLOW}http://localhost:8081${NC}  # Redis Admin (Redis Commander)"
    echo ""
    echo -e "${GREEN}Happy coding! 🚀${NC}"
}

# Run main function
main "$@"