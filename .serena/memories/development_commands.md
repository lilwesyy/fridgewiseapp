# Development Commands

## Installation
```bash
# Install all dependencies
npm run install:all

# Individual installations
cd backend && npm install
cd frontend/mobile && npm install
cd frontend/web && npm install
```

## Running the Application
```bash
# Start all services
npm run dev  # Backend + Mobile

# Individual services
npm run start:backend    # Backend API only
npm run start:mobile     # Mobile app only
npm run start:web        # Web app only

# With tunneling (for external device access)
npm run dev:tunnel
```

## Backend Specific Commands
```bash
cd backend
npm run dev           # Development server with ts-node
npm start            # Production server
npm test             # Run tests
npm run create-indexes    # Create database indexes
npm run optimize-db      # Optimize database
npm run rebuild-indexes  # Rebuild database indexes
```

## Development Services
- **Backend API**: http://localhost:3000
- **MongoDB**: mongodb://localhost:27017/fridgewiseai
- **Recognize API**: http://localhost:8000 (GPU) or http://localhost:8001 (CPU)

## Docker Services
```bash
./scripts/start-services.sh  # Start Docker services
docker-compose up -d         # Manual Docker start
```