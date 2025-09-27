# AI Pet Video

Progress:

ai-pet-video-system/
├── backend/ # ✅
│ ├── package.json # ✅
│ ├── .env.example # ✅
│ ├── .env # ✅
│ ├── .gitignore # ✅
│ ├── Dockerfile # ✅
│ ├── src/
│ │ ├── app.js # ✅
│ │ ├── server.js # ✅
│ │ ├── config/
│ │ │ ├── database.js # ✅
│ │ │ ├── aws.js # ✅
│ │ │ └── redis.js # ✅
│ │ ├── models/
│ │ │ ├── index.js # ✅
│ │ │ ├── User.js # ✅
│ │ │ ├── Request.js # ✅
│ │ │ └── Template.js # ✅
│ │ ├── controllers/
│ │ │ ├── userController.js # ✅
│ │ │ ├── requestController.js # ✅
│ │ │ ├── paymentController.js # ✅
│ │ │ └── adminController.js # ✅
│ │ ├── routes/
│ │ │ ├── index.js # ✅
│ │ │ ├── users.js # ✅
│ │ │ ├── requests.js # ✅
│ │ │ ├── payments.js # ✅
│ │ │ └── admin.js # ✅
│ │ ├── services/
│ │ │ ├── s3Service.js # ✅
│ │ │ ├── emailService.js # ✅
│ │ │ ├── paymentService.js # ✅
│ │ │ └── queueService.js # ✅
│ │ ├── middleware/
│ │ │ ├── auth.js # ✅
│ │ │ ├── validation.js # ✅
│ │ │ ├── rateLimit.js # ✅
│ │ │ └── errorHandler.js # ✅
│ │ └── utils/
│ │ ├── logger.js # ✅
│ │ ├── constants.js # ✅
│ │ └── helpers.js # ✅
│ └── migrations/
│ ├── 001-create-users.sql # ✅
│ ├── 002-create-requests.sql # ✅
│ └── 003-create-templates.sql # ✅
│
├── telegram-bot/ # ⏳ Stage 2
│ ├── package.json
│ ├── .env.example
│ ├── bot.js
│ └── src/
│ ├── config/
│ │ └── i18n.js
│ ├── handlers/
│ │ ├── start.js
│ │ ├── language.js
│ │ ├── photoUpload.js
│ │ ├── scriptInput.js
│ │ ├── payment.js
│ │ └── status.js
│ ├── services/
│ │ ├── apiService.js
│ │ └── paymentTelegram.js
│ ├── utils/
│ │ └── keyboards.js
│ └── locales/
│ ├── en.json
│ └── ru.json
│
├── frontend/ # ⏳ Stage 3-4 + Admin Panel
│ ├── package.json
│ ├── .env.example
│ ├── public/
│ │ ├── index.html
│ │ └── favicon.ico
│ └── src/
│ ├── index.js
│ ├── App.js
│ ├── config/
│ │ └── i18n.js
│ ├── components/
│ │ ├── landing/
│ │ │ ├── HeroSection.js
│ │ │ ├── StepsSection.js
│ │ │ ├── StepCard.js
│ │ │ ├── FeaturesSection.js
│ │ │ ├── FeatureList.js
│ │ │ ├── HowItWorks.js
│ │ │ ├── CTAButton.js
│ │ │ └── FinalCTA.js
│ │ ├── common/
│ │ │ ├── Header.js
│ │ │ ├── Footer.js
│ │ │ ├── LanguageSwitcher.js
│ │ │ └── Loader.js
│ │ ├── forms/
│ │ │ ├── RequestForm.js
│ │ │ ├── PhotoUploader.js
│ │ │ ├── ScriptInput.js
│ │ │ └── TemplateSelector.js
│ │ ├── admin/
│ │ │ ├── AdminSidebar.js
│ │ │ ├── RequestList.js
│ │ │ ├── RequestDetail.js
│ │ │ ├── StatsCard.js
│ │ │ ├── StatusBadge.js
│ │ │ └── VideoUploader.js
│ │ └── ui/
│ │ ├── Button.js
│ │ ├── Modal.js
│ │ ├── Card.js
│ │ └── Input.js
│ ├── pages/
│ │ ├── LandingPage.js
│ │ ├── LoginPage.js
│ │ ├── DashboardPage.js
│ │ ├── CreateRequestPage.js
│ │ ├── RequestDetailPage.js
│ │ └── admin/
│ │ ├── AdminLogin.js
│ │ ├── AdminDashboard.js
│ │ ├── AdminRequests.js
│ │ ├── AdminRequestDetail.js
│ │ └── AdminStatistics.js
│ ├── services/
│ │ ├── api.js
│ │ ├── auth.js
│ │ ├── stripe.js
│ │ └── s3Service.js
│ ├── contexts/
│ │ ├── AuthContext.js
│ │ ├── LanguageContext.js
│ │ └── RequestContext.js
│ ├── hooks/
│ │ ├── useAuth.js
│ │ ├── useRequests.js
│ │ ├── useUpload.js
│ │ └── useAdmin.js
│ ├── utils/
│ │ ├── constants.js
│ │ ├── helpers.js
│ │ ├── formatters.js
│ │ └── validators.js
│ ├── styles/
│ │ ├── index.css
│ │ ├── landing.css
│ │ ├── components/
│ │ └── admin.css
│ └── locales/
│ ├── en.json
│ └── ru.json
│
├── docs/
│ ├── deployment.md
│ ├── api.md
│ └── frontend-guide.md
│
├── docker-compose.yml
├── docker-compose.prod.yml
└── README.md

# Stage 1 Testing Guide

Prerequisites:

- Docker installed
- Node.js installed
- Git installed

## Step 1: Clone and Setup

git clone <repository-url>
cd ai-pet-video-system/backend
npm install

## Step 2: Start Docker Containers

docker-compose -f docker-compose.test.yml up -d

## Step 3: Configure Environment

Copy .env.example to .env and keep default values.

## Step 4: Start Backend Server

npm start
Wait for message: "🚀 Server started successfully!"

## Step 5: Test API with Postman

- Health Check

GET http://localhost:3000/api/v1/health
Expected: {"status":"OK"}

- Create User

POST http://localhost:3000/api/v1/users
Body:

json
{
"email": "test@example.com",
"password": "password123",
"username": "testuser",
"first_name": "Test",
"last_name": "User"
}

- Login

POST http://localhost:3000/api/v1/users/login
Body:

json
{
"email": "test@example.com",
"password": "password123"
}
Save the JWT token from response.

- Create Video Request

POST http://localhost:3000/api/v1/requests
Headers: Authorization: Bearer <your-token>
Body:

json
{
"photos": ["photo1.jpg", "photo2.jpg"],
"script": "Make my pet video"
}

- Check Requests

GET http://localhost:3000/api/v1/requests/my
Headers: Authorization: Bearer <your-token>

Step 6: Stop Services

# Stop backend server: Ctrl+C

# Stop Docker containers

docker-compose -f docker-compose.test.yml down

Expected Results:

- All API endpoints return success responses
- Database stores users and requests
- Redis handles rate limiting
- No errors in console logs
