# AI Pet Video System

A complete platform for creating AI-generated pet videos with multi-language support and multiple payment options.

## Project Status

✅ **Stage 1: Basic Infrastructure** - Complete  
✅ **Stage 2: Telegram Bot** - Complete  
✅ **Stage 3: Website** - Complete  
🔄 **Stage 4: Admin Panel** - In Progress  
⏳ **Stage 5: Final Integration** - Pending

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 16+
- Git

### Local Development Setup

1. **Clone and Setup Backend**

```bash
git clone <repository-url>
cd ai-pet-video-system/backend
npm install
cp .env.example .env
```

## Step 2: Start Docker Containers

```bash
docker-compose -f docker-compose.test.yml up -d
```

## Step 3: Setup Database

```bash
node scripts/migrate.js
```

## Step 4: Copy Locales

```bash
node copy-locales.js
```

## Step 5: Start Services

```bash
# Backend (Terminal 1)
cd backend && npm start

# Frontend (Terminal 2)
cd frontend && npm start

# Telegram Bot (Terminal 3, optional)
cd telegram-bot && npm start
```

# Stop backend server: Ctrl+C

# Stop Docker containers

docker-compose -f docker-compose.test.yml down

Expected Results:

- All API endpoints return success responses
- Database stores users and requests
- Redis handles rate limiting
- No errors in console logs

# Access Points

Website: http://localhost:3000

API: http://localhost:3001/api/v1/health

Admin Panel: http://localhost:3000/admin

Database: localhost:5432 (postgres/password)

# Project Structure

```text
ai-pet-video-system/
├── backend/          # Node.js API server
├── frontend/         # React.js website
├── telegram-bot/     # Telegram bot
├── shared-locales/   # Translation files
└── docker-compose.test.yml
```

# Next Steps

1. Complete Admin Panel functionality (Stage 4)
2. Integrate AI video generation service
3. Deploy to production environment
4. Set up monitoring and analytics

# Support

For issues and questions:

- Check console logs for errors
- Verify database connections
- Ensure locale files are copied correctly
- Confirm environment variables are set
