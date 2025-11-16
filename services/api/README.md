# VoiceCast API

Backend API server for the VoiceCast platform built with Fastify, Prisma, and PostgreSQL.

## Features

- **Authentication**: JWT-based auth with 2FA support
- **Real-time**: WebSocket support for chat and streaming
- **Payment**: Stripe integration for coins, gifts, and subscriptions
- **Analytics**: Real-time metrics and historical data
- **Admin**: Comprehensive moderation and management tools
- **Scalable**: Redis caching, job queues, and pub/sub

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Fastify
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Queue**: BullMQ
- **Storage**: MinIO (S3-compatible)
- **Search**: MeiliSearch
- **Payments**: Stripe
- **Real-time**: Socket.io & WebSockets

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Docker (optional)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up database:
```bash
npx prisma generate
npx prisma migrate dev
```

4. Start development server:
```bash
npm run dev
```

### Using Docker

```bash
docker-compose up -d
```

## API Documentation

### Authentication Endpoints

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `POST /auth/2fa/setup` - Setup 2FA
- `POST /auth/2fa/verify` - Verify 2FA code

### User Endpoints

- `GET /users/:username` - Get user profile
- `GET /users/me` - Get current user
- `PATCH /users/me/profile` - Update profile
- `POST /users/:userId/follow` - Follow user
- `DELETE /users/:userId/follow` - Unfollow user

### Stream Endpoints

- `GET /streams` - List streams
- `GET /streams/live` - List live streams
- `GET /streams/:streamId` - Get stream details
- `POST /streams` - Create stream
- `PATCH /streams/:streamId` - Update stream
- `POST /streams/:streamId/start` - Start stream
- `POST /streams/:streamId/end` - End stream

### Chat Endpoints

- `GET /chat/:streamId/messages` - Get messages
- `POST /chat/:streamId/messages` - Send message
- `DELETE /chat/:streamId/messages/:messageId` - Delete message
- `GET /chat/ws` - WebSocket connection

### Payment Endpoints

- `GET /payments/wallet` - Get wallet
- `POST /payments/coins/purchase` - Purchase coins
- `POST /payments/gifts/send` - Send gift
- `POST /payments/subscriptions` - Create subscription
- `POST /payments/payouts` - Request payout

### Admin Endpoints

- `GET /admin/dashboard` - Dashboard stats
- `GET /admin/users` - List users
- `PATCH /admin/users/:userId/status` - Update user status
- `GET /admin/reports` - List reports
- `POST /admin/reports/:reportId/resolve` - Resolve report

### Analytics Endpoints

- `GET /analytics/streams/:streamId` - Stream analytics
- `GET /analytics/user` - User analytics
- `GET /analytics/top-streams` - Top streams
- `GET /analytics/realtime` - Real-time stats

## Database Schema

See `prisma/schema.prisma` for the complete database schema including:

- User management
- Streams and recordings
- Chat messages
- Payments and wallets
- Analytics
- Admin tools

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm test` - Run tests

## Environment Variables

See `.env.example` for all available environment variables.

## License

MIT
