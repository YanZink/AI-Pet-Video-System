# AI Pet Video

Progress:

```text
ai-pet-video-system/
├── backend/ #
│   ├── package.json #
│   ├── .env.example #
│   ├── Dockerfile #
│   ├── scripts/
│   │      └── migrate.js
│   ├── src/
│   │   ├── app.js #
│   │   ├── server.js #
│   │   ├── config/
│   │   │   ├── database.js #
│   │   │   ├── aws.js #
│   │   │   └── redis.js #
│   │   ├── models/
│   │   │   ├── index.js #
│   │   │   ├── User.js #
│   │   │   ├── Request.js #
│   │   │   └── Template.js #
│   │   ├── controllers/
│   │   │   ├── userController.js #
│   │   │   ├── requestController.js #
│   │   │   ├── paymentController.js #
│   │   │   └── adminController.js #
│   │   ├── routes/
│   │   │   ├── index.js #
│   │   │   ├── users.js #
│   │   │   ├── requests.js #
│   │   │   ├── payments.js #
│   │   │   └── admin.js #
│   │   ├── services/
│   │   │   ├── s3Service.js #
│   │   │   ├── emailService.js #
│   │   │   ├── paymentService.js #
│   │   │   ├── queueService.js #
│   │   │   └── translationService.js #
│   │   ├── middleware/
│   │   │   ├── auth.js #
│   │   │   ├── validation.js #
│   │   │   ├── rateLimit.js #
│   │   │   ├── errorHandler.js #
│   │   │   └── i18n.js #
│   │   ├── locales/ #
│   │   │   ├── en.json #
│   │   │   ├── ru.json #
│   │   │   └── index.js #
│   │   └── utils/
│   │       ├── logger.js #
│   │       ├── constants.js #
│   │       ├── helpers.js #
│   │       └── index.js #
│   └── migrations/ #
│       ├── 001-initial-schema.sql #
│       └── 002-add-sample-data.sql #
│
├── telegram-bot/ # Stage 2
│   ├── package.json #
│   ├── .env.example
│   ├── Dockerfile
│   ├── bot.js
│   └── src/
│       ├── config/
│       │   ├── i18n.js #
│       │   └── redis.js
│       ├── handlers/
│       │   ├── start.js #
│       │   ├── language.js #
│       │   ├── photoUpload.js #
│       │   ├── scriptInput.js
│       │   ├── payment.js
│       │   └── status.js
│       ├── services/
│       │   ├── apiService.js
│       │   ├── sessionService.js
│       │   └── paymentTelegram.js
│       └── utils/
│           └── keyboards.js #
│
├── docker-compose.test.yml
└── README.md
```

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
