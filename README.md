# AI Pet Video System 🐾

A complete full-stack platform for creating AI-generated pet videos with Telegram bot integration, multi-language support, and automated payment processing.

## 🎯 Project Overview

AI Pet Video System is a production-ready SaaS application that allows users to create personalized AI-generated videos featuring their pets. The system includes a responsive web interface, Telegram bot integration, admin dashboard, and automated payment processing.

✨ Key Features

```
🤖 Telegram Bot Integration - Create videos directly from Telegram
🌐 Multi-language Support - English and Russian (i18n)
💳 Multiple Payment Options - Stripe & Telegram Stars
📊 Admin Dashboard - Manage requests, users, and analytics
☁️ Cloud Infrastructure - Fully deployed on AWS
🔐 Secure Authentication - JWT-based auth system
📧 Email Notifications - AWS SES integration
📦 File Storage - AWS S3 for photos and videos
📈 Real-time Monitoring - CloudWatch logs and metrics
```

## 🚀 Live Deployment

```
Website: http://52.6.208.92/
API: http://52.6.208.92/api/v1/
Health Check: http://52.6.208.92/health
Admin Panel: http://52.6.208.92/admin
```

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│   AWS EC2 (Ubuntu 22.04)            │
│                                     │
│   ✅ Backend API (PM2, port 3000)   │
│   ✅ Telegram Bot (PM2, port 3001)  │
│   ✅ PostgreSQL (localhost:5432)    │
│   ✅ Redis (localhost:6379)         │
│   ✅ Nginx (reverse proxy)          │
│   ✅ Frontend (React SPA)           │
└─────────────────────────────────────┘
         │
         ├──→ AWS S3 (file storage)
         ├──→ AWS SES (email service)
         ├──→ AWS CloudWatch (monitoring)
         └──→ Stripe API (payments)
```

## 🛠️ Tech Stack

### Backend

- **Runtime:** Node.js 18
- **Framework:** Express.js
- **Database:** PostgreSQL 14
- **Cache:** Redis 7
- **ORM:** Sequelize
- **Auth:** JWT
- **Payments:** Stripe, Telegram Stars
- **File Upload:** AWS S3
- **Email:** AWS SES
- **Localization:** i18next

### Frontend

- **Framework:** React 18
- **Routing:** React Router v6
- **State Management:** React Context
- **Styling:** CSS Modules + Tailwind CSS
- **HTTP Client:** Axios
- **Animations:** Framer Motion
- **Icons:** Lucide React

### Infrastructure

- **Cloud:** AWS (EC2, S3, SES, CloudWatch)
- **Web Server:** Nginx
- **Process Manager:** PM2
- **Database:** PostgreSQL
- **Cache:** Redis
- **CI/CD:** Manual deployment scripts
- **Monitoring:** CloudWatch Logs

### Telegram Bot

- **Framework:** Telegraf 4
- **Integration:** Backend REST API
- **Sessions:** Redis
- **Payments:** Telegram Stars

## 📦 Project Structure

```
ai-pet-video-system/
├── backend/                 # Node.js Backend API
│   ├── src/
│   │   ├── app.js          # Express app setup
│   │   ├── server.js       # Server entry point
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Custom middleware
│   │   └── utils/          # Helper functions
│   ├── migrations/         # Database migrations
│   ├── scripts/            # Utility scripts
│   ├── package.json
│   └── .env.example
│
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── index.jsx       # Entry point
│   │   ├── App.jsx         # Root component
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   └── styles/         # Global styles
│   ├── public/
│   ├── package.json
│   └── .env.example
│
├── telegram-bot/           # Telegram Bot
│   ├── bot.js             # Bot entry point
│   ├── src/
│   │   ├── config/        # Bot configuration
│   │   ├── handlers/      # Command handlers
│   │   ├── services/      # API integration
│   │   └── utils/         # Helpers
│   ├── package.json
│   └── .env.example
│
├── shared-locales/         # Shared translations
│   ├── en/                # English translations
│   └── ru/                # Russian translations
│
├── docker-compose.test.yml # Local development
└── README.md
```

## 🚀 Getting Started

Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- AWS Account (for S3, SES)
- Stripe Account (for payments)
- Telegram Bot Token

### Local Development Setup

1. Clone Repository

```
git clone https://github.com/YanZink/AI-Pet-Video-System.git
cd AI-Pet-Video-System
```

2. Start Docker Services (PostgreSQL + Redis)

```
docker-compose -f docker-compose.test.yml up -d
```

3. Setup Backend

```
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials

# Run migrations
npm run migrate

# Start backend
npm run dev
```

4. Setup Frontend

```
cd frontend
npm install
cp .env.example .env
# Edit .env with API URL

# Start frontend
npm start
```

5. Setup Telegram Bot (Optional)

```
cd telegram-bot
npm install
cp .env.example .env
# Edit .env with bot token

# Start bot
npm run dev
```

## Environment Variables

- Backend .env

```
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_pet_video_dev
DB_USER=postgres
DB_PASS=password

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# AWS
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Email (AWS SES)
SES_REGION=us-east-1
FROM_EMAIL=noreply@yourdomain.com

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# URLs
FRONTEND_URL=http://localhost:3001
```

- Frontend .env

```
REACT_APP_API_BASE_URL=http://localhost:3000/api/v1
REACT_APP_API_TIMEOUT=30000
NODE_ENV=production
REACT_APP_TELEGRAM_BOT_URL= your_telegram_bot_url
```

- Telegram Bot .env

```
TELEGRAM_BOT_TOKEN=your_bot_token
API_BASE_URL=http://localhost:3000/api/v1
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

## 📡 API Documentation

Authentication

```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/telegram
GET  /api/v1/auth/me
```

Requests

```
GET    /api/v1/requests              # List user's requests
POST   /api/v1/requests              # Create new request
GET    /api/v1/requests/:id          # Get request details
PATCH  /api/v1/requests/:id          # Update request
DELETE /api/v1/requests/:id          # Cancel request
```

Payments

```
POST /api/v1/payments/stripe/create-session
POST /api/v1/payments/stripe/webhook
POST /api/v1/payments/telegram/verify
```

Admin (requires admin role)

```
GET /api/v1/admin/requests # All requests
PATCH /api/v1/admin/requests/:id # Update any request
GET /api/v1/admin/users # All users
POST /api/v1/admin/users/:id/promote # Make user admin
GET /api/v1/admin/stats # System statistics
```

Health Check

```
GET /health                          # Server health status
```

## 🔐 Security

```
✅ JWT authentication with secure secrets
✅ Password hashing with bcrypt
✅ SQL injection protection (Sequelize ORM)
✅ CORS configuration
✅ Rate limiting
✅ Environment variables for secrets
✅ IAM roles with least privilege
✅ Automated backups
✅ CloudWatch monitoring
```

## 👨‍💻 Author

Yan Zinkovskii

GitHub: @YanZink
Email: zinkovskii1803@gmail.com

## 📊 Project Statistics

Total Lines of Code: ~15,000+
API Endpoints: 25+
Database Tables: 4 (users, requests, templates, translations)
Supported Languages: 2 (EN, RU)
Payment Methods: 2 (Stripe, Telegram Stars)
AWS Services Used: 5 (EC2, S3, SES, CloudWatch, IAM)
Uptime: 99.9%

⭐ Star this repository if you find it helpful!
