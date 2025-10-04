# AI Pet Video

Progress:

```text
ai-pet-video-system/
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── Dockerfile
│   ├── scripts/
│   │   └── migrate.js
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   ├── aws.js
│   │   │   └── redis.js
│   │   ├── models/
│   │   │   ├── index.js
│   │   │   ├── User.js
│   │   │   ├── Request.js
│   │   │   └── Template.js
│   │   ├── controllers/
│   │   │   ├── userController.js
│   │   │   ├── requestController.js
│   │   │   ├── paymentController.js
│   │   │   └── adminController.js
│   │   ├── routes/
│   │   │   ├── index.js
│   │   │   ├── users.js
│   │   │   ├── requests.js
│   │   │   ├── payments.js
│   │   │   └── admin.js
│   │   ├── services/
│   │   │   ├── s3Service.js
│   │   │   ├── emailService.js
│   │   │   ├── paymentService.js
│   │   │   └── queueService.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── validation.js
│   │   │   ├── rateLimit.js
│   │   │   ├── errorHandler.js
│   │   │   └── i18n.js
│   │   └── utils/
│   │       ├── logger.js
│   │       ├── constants.js
│   │       ├── helpers.js
│   │       └── index.js
│   └── migrations/
│       ├── 001-initial-schema.sql
│       └── 002-add-sample-data.sql
│
├── telegram-bot/
│   ├── package.json
│   ├── .env.example
│   ├── Dockerfile
│   ├── bot.js
│   └── src/
│       ├── config/
│       │   ├── i18n.js
│       │   └── redis.js
│       ├── handlers/
│       │   ├── start.js
│       │   ├── language.js
│       │   ├── photoUpload.js
│       │   ├── scriptInput.js
│       │   ├── payment.js
│       │   └── status.js
│       ├── services/
│       │   ├── apiService.js
│       │   ├── sessionService.js
│       │   └── paymentTelegram.js
│       └── utils/
│             ├── keyboards.js #
│             └── logger.js
│
│
├── shared-locales/
│   ├── index.js
│   ├── en/
│   │   ├── common.json
│   │   ├── auth.json
│   │   ├── videos.json
│   │   ├── payments.json
│   │   ├── errors.json
│   │   └── notifications.json
│   │
│   │
│   └── ru/
│        ├── common.json
│        ├── auth.json
│        ├── videos.json
│        ├── payments.json
│        ├── errors.json
│        └── notifications.json
│
│
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

## Telegram Bot (Stage 2) - Ready for Testing!

Telegram Stars Payments Integration

Our Telegram bot is fully integrated with Telegram Stars payment system and ready for testing in the test environment.

Key Features Implemented:
✅ Multi-language support (English/Russian) with i18n

✅ Photo upload flow with progress tracking

✅ Script input with skip option

✅ Telegram Stars payments with test environment setup

✅ Payment handlers for pre-checkout and successful payments

✅ Session management with Redis

✅ Backend API integration

Testing Telegram Stars Payments:
The bot uses Telegram's test environment for Stars payments:

```
// Already configured in telegramPayment.js
provider_token: '', // Empty string for test environment
currency: 'XTR', // Telegram Stars currency
```

To test the Telegram bot:
Configure bot in @BotFather:

```
/setinline
/setuserpic
/setdescription
```

# Enable payments in bot settings

Start the bot:

```
cd telegram-bot
npm install
cp .env.example .env
# Add your TELEGRAM_BOT_TOKEN to .env
npm start
```

Test the complete flow:

- Start conversation with bot
- Upload photos (1-10 images)
- Add optional script or skip
- Proceed to payment
- Test Stars payment in test environment
- Verify status updates

Payment Flow:

- Bot sends invoice via sendInvoice method
- User confirms payment in Telegram
- Pre-checkout query validation
- Successful payment processing
- Backend integration updates request status
- User receives confirmation

Ready for Production:
To move to production:

- Replace empty "provider_token" with real token
- Switch bot from test to production mode
- Update environment variables

The Telegram bot is fully functional and ready for demonstration!
