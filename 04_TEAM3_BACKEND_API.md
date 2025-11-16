# ClaudeCode Team 3: Backend & API プロンプト

## 初期セットアッププロンプト

```
You are Team 3 responsible for building the complete backend infrastructure including APIs, real-time services, database, and media streaming for VoiceCast platform.

## Your Mission
Build a scalable, secure, and performant backend with:
1. RESTful API with GraphQL support
2. Real-time WebSocket services
3. Media streaming server
4. Database design and optimization
5. Authentication and authorization
6. Payment processing
7. Analytics and monitoring

## Technical Architecture

### Core Services
- API Gateway: Kong / Traefik
- Main API: Node.js + Fastify
- Real-time: Socket.io + Redis Adapter
- Media Server: MediaSoup
- Database: PostgreSQL + TimescaleDB
- Cache: Redis + Dragonfly
- Queue: BullMQ
- Storage: MinIO (S3-compatible)
- Search: MeiliSearch

## Implementation Tasks

### Task 1: Project Setup

Create the complete project structure:

```bash
mkdir -p services/api
cd services/api
npm init -y

# Install dependencies
npm install fastify @fastify/cors @fastify/helmet @fastify/rate-limit
npm install @fastify/jwt @fastify/cookie @fastify/multipart @fastify/websocket
npm install @prisma/client prisma
npm install redis ioredis bullmq
npm install mediasoup mediasoup-client
npm install stripe
npm install argon2 speakeasy qrcode
npm install zod @sinclair/typebox
npm install winston pino pino-pretty
npm install dotenv

# Dev dependencies
npm install -D @types/node typescript tsx nodemon
npm install -D @swc/core @swc/cli
npm install -D vitest @vitest/ui supertest
```

Create `services/api/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "allowSyntheticDefaultImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@modules/*": ["src/modules/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Task 2: Database Schema

Create `services/api/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["jsonProtocol", "fullTextSearch", "tracing"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User Management
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  username        String    @unique @db.VarChar(30)
  passwordHash    String
  emailVerified   Boolean   @default(false)
  twoFactorSecret String?
  
  // Profile
  displayName     String    @db.VarChar(50)
  avatar          String?
  banner          String?
  bio             String?   @db.VarChar(500)
  country         String?   @db.VarChar(2)
  language        String    @default("en") @db.VarChar(5)
  timezone        String    @default("UTC")
  
  // Status
  status          UserStatus @default(ACTIVE)
  role            UserRole   @default(USER)
  verifiedStreamer Boolean   @default(false)
  partnered       Boolean    @default(false)
  
  // Settings
  privacy         Json       @default("{}")
  notifications   Json       @default("{}")
  streamSettings  Json       @default("{}")
  
  // Relations
  streams         Stream[]
  recordings      Recording[]
  followers       Follow[]   @relation("followers")
  following       Follow[]   @relation("following")
  sentMessages    ChatMessage[]
  sentGifts       Gift[]     @relation("sender")
  receivedGifts   Gift[]     @relation("receiver")
  blockedUsers    Block[]    @relation("blocker")
  blockedBy       Block[]    @relation("blocked")
  reports         Report[]   @relation("reporter")
  reportedContent Report[]   @relation("reported")
  
  // Monetization
  wallet          Wallet?
  subscriptions   Subscription[] @relation("subscriber")
  subscribedTo    Subscription[] @relation("creator")
  transactions    Transaction[]
  payouts         Payout[]
  
  // Analytics
  streamAnalytics StreamAnalytics[]
  activities      Activity[]
  
  // Metadata
  lastActiveAt    DateTime?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  deletedAt       DateTime?
  
  @@index([username])
  @@index([email])
  @@index([status])
  @@index([createdAt])
}

model Stream {
  id              String     @id @default(cuid())
  title           String     @db.VarChar(100)
  description     String?    @db.VarChar(500)
  thumbnail       String?
  streamKey       String     @unique @default(cuid())
  
  // Configuration
  isLive          Boolean    @default(false)
  visibility      StreamVisibility @default(PUBLIC)
  maxViewers      Int        @default(10000)
  audioQuality    AudioQuality @default(HIGH)
  allowChat       Boolean    @default(true)
  allowGifts      Boolean    @default(true)
  subscribersOnly Boolean    @default(false)
  ageRestricted   Boolean    @default(false)
  
  // Streaming Data
  rtmpUrl         String?
  playbackUrl     String?
  recordingEnabled Boolean   @default(false)
  
  // Relations
  hostId          String
  host            User       @relation(fields: [hostId], references: [id], onDelete: Cascade)
  categoryId      String?
  category        Category?  @relation(fields: [categoryId], references: [id])
  tags            Tag[]
  viewers         Viewer[]
  messages        ChatMessage[]
  gifts           Gift[]
  recordings      Recording[]
  analytics       StreamAnalytics[]
  moderators      StreamModerator[]
  
  // Scheduling
  scheduledFor    DateTime?
  actualStartTime DateTime?
  endedAt         DateTime?
  
  // Statistics
  peakViewers     Int        @default(0)
  totalViewers    Int        @default(0)
  totalMessages   Int        @default(0)
  totalGifts      Int        @default(0)
  totalRevenue    Decimal    @default(0) @db.Decimal(10, 2)
  duration        Int        @default(0) // seconds
  
  // Metadata
  metadata        Json       @default("{}")
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  
  @@index([hostId])
  @@index([isLive])
  @@index([categoryId])
  @@index([scheduledFor])
  @@index([createdAt])
}

model Wallet {
  id              String     @id @default(cuid())
  userId          String     @unique
  user            User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Balances
  coins           Int        @default(0)
  gems            Int        @default(0)
  earnings        Decimal    @default(0) @db.Decimal(10, 2)
  pendingEarnings Decimal    @default(0) @db.Decimal(10, 2)
  totalEarnings   Decimal    @default(0) @db.Decimal(10, 2)
  totalWithdrawn  Decimal    @default(0) @db.Decimal(10, 2)
  
  // Payment Methods
  stripeCustomerId    String?
  stripeAccountId     String?
  paypalEmail         String?
  bankAccount         Json?
  
  // Relations
  transactions    Transaction[]
  payouts         Payout[]
  
  // Settings
  minPayout       Decimal    @default(50) @db.Decimal(10, 2)
  payoutSchedule  PayoutSchedule @default(MONTHLY)
  currency        String     @default("USD") @db.VarChar(3)
  
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
}

model Transaction {
  id              String     @id @default(cuid())
  type            TransactionType
  status          TransactionStatus @default(PENDING)
  
  // Parties
  userId          String
  user            User       @relation(fields: [userId], references: [id])
  walletId        String
  wallet          Wallet     @relation(fields: [walletId], references: [id])
  
  // Amount
  amount          Decimal    @db.Decimal(10, 2)
  currency        String     @db.VarChar(3)
  coins           Int?
  gems            Int?
  
  // Payment Details
  paymentMethod   String?
  stripePaymentId String?
  paypalOrderId   String?
  
  // Metadata
  description     String?
  metadata        Json       @default("{}")
  failureReason   String?
  
  createdAt       DateTime   @default(now())
  completedAt     DateTime?
  
  @@index([userId])
  @@index([status])
  @@index([type])
  @@index([createdAt])
}

// Enums
enum UserStatus {
  ACTIVE
  SUSPENDED
  BANNED
  DELETED
}

enum UserRole {
  USER
  MODERATOR
  ADMIN
  SUPER_ADMIN
}

enum StreamVisibility {
  PUBLIC
  FOLLOWERS_ONLY
  SUBSCRIBERS_ONLY
  PRIVATE
}

enum AudioQuality {
  LOW      // 64kbps
  MEDIUM   // 128kbps
  HIGH     // 256kbps
  ULTRA    // 510kbps
}

enum TransactionType {
  COIN_PURCHASE
  GEM_PURCHASE
  GIFT_SENT
  GIFT_RECEIVED
  SUBSCRIPTION
  DONATION
  PAYOUT
  REFUND
}

enum TransactionStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}

enum PayoutSchedule {
  WEEKLY
  BIWEEKLY
  MONTHLY
}
```

### Task 3: API Server Implementation

Create `services/api/src/server.ts`:

```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import websocket from '@fastify/websocket';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { Queue } from 'bullmq';
import { config } from './config';
import { errorHandler } from './utils/error-handler';
import { logger } from './utils/logger';

// Import modules
import { authModule } from './modules/auth';
import { userModule } from './modules/user';
import { streamModule } from './modules/stream';
import { chatModule } from './modules/chat';
import { paymentModule } from './modules/payment';
import { adminModule } from './modules/admin';
import { analyticsModule } from './modules/analytics';

export async function createServer() {
  // Initialize services
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });
  
  const redis = new Redis(config.redis.url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
  });
  
  const pubsub = {
    publisher: new Redis(config.redis.url),
    subscriber: new Redis(config.redis.url),
  };
  
  // Initialize queues
  const queues = {
    email: new Queue('email', { connection: redis }),
    notification: new Queue('notification', { connection: redis }),
    analytics: new Queue('analytics', { connection: redis }),
    media: new Queue('media', { connection: redis }),
    payout: new Queue('payout', { connection: redis }),
  };

  // Create Fastify instance
  const fastify = Fastify({
    logger: logger,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId',
    disableRequestLogging: false,
    trustProxy: true,
    ajv: {
      customOptions: {
        removeAdditional: 'all',
        coerceTypes: true,
        useDefaults: true,
      },
    },
  });

  // Register plugins
  await fastify.register(cors, {
    origin: config.cors.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'wss:', 'https:'],
      },
    },
  });

  await fastify.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    cache: 10000,
    skipOnError: false,
    redis: redis,
    keyGenerator: (req) => {
      return req.headers['x-forwarded-for'] || 
             req.connection.remoteAddress || 
             req.ip;
    },
  });

  await fastify.register(jwt, {
    secret: config.jwt.secret,
    sign: {
      expiresIn: config.jwt.expiresIn,
      issuer: 'voicecast',
    },
    verify: {
      issuer: 'voicecast',
    },
  });

  await fastify.register(cookie, {
    secret: config.cookie.secret,
    parseOptions: {
      sameSite: 'lax',
      secure: config.isProd,
      httpOnly: true,
    },
  });

  await fastify.register(multipart, {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB
      files: 10,
    },
  });

  await fastify.register(websocket, {
    options: {
      maxPayload: 1024 * 1024, // 1MB
      clientTracking: true,
      perMessageDeflate: true,
    },
  });

  // Decorate with services
  fastify.decorate('prisma', prisma);
  fastify.decorate('redis', redis);
  fastify.decorate('pubsub', pubsub);
  fastify.decorate('queues', queues);

  // Health check
  fastify.get('/health', async () => {
    const checks = await Promise.allSettled([
      prisma.$queryRaw`SELECT 1`,
      redis.ping(),
    ]);
    
    const isHealthy = checks.every(check => check.status === 'fulfilled');
    
    return {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {
        database: checks[0].status === 'fulfilled',
        redis: checks[1].status === 'fulfilled',
      },
    };
  });

  // Register modules
  await fastify.register(authModule, { prefix: '/auth' });
  await fastify.register(userModule, { prefix: '/users' });
  await fastify.register(streamModule, { prefix: '/streams' });
  await fastify.register(chatModule, { prefix: '/chat' });
  await fastify.register(paymentModule, { prefix: '/payments' });
  await fastify.register(adminModule, { prefix: '/admin' });
  await fastify.register(analyticsModule, { prefix: '/analytics' });

  // Error handler
  fastify.setErrorHandler(errorHandler);

  // Graceful shutdown
  const gracefulShutdown = async () => {
    logger.info('Shutting down gracefully...');
    
    await fastify.close();
    await prisma.$disconnect();
    await redis.quit();
    await pubsub.publisher.quit();
    await pubsub.subscriber.quit();
    
    process.exit(0);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  return fastify;
}

// Start server
if (require.main === module) {
  createServer().then(fastify => {
    fastify.listen({ 
      port: config.port, 
      host: '0.0.0.0' 
    }, (err) => {
      if (err) {
        logger.error(err);
        process.exit(1);
      }
    });
  });
}
```

### Task 4: Authentication Module

Create `services/api/src/modules/auth/auth.controller.ts`:

```typescript
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import argon2 from 'argon2';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { AuthService } from './auth.service';
import { EmailService } from '@/services/email.service';

// Validation schemas
const RegisterSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(100),
  displayName: z.string().min(1).max(50),
  acceptTerms: z.boolean().refine(val => val === true),
});

const LoginSchema = z.object({
  username: z.string(),
  password: z.string(),
  twoFactorCode: z.string().optional(),
  rememberMe: z.boolean().default(false),
});

export class AuthController {
  constructor(
    private authService: AuthService,
    private emailService: EmailService
  ) {}

  async register(req: FastifyRequest<{ Body: z.infer<typeof RegisterSchema> }>, reply: FastifyReply) {
    const { email, username, password, displayName } = req.body;

    // Check if user exists
    const existingUser = await req.server.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return reply.code(409).send({
        error: 'User already exists',
        field: existingUser.email === email ? 'email' : 'username',
      });
    }

    // Hash password
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    // Create user
    const user = await req.server.prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        displayName,
        wallet: {
          create: {
            coins: 100, // Welcome bonus
          },
        },
      },
      include: {
        wallet: true,
      },
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(user.email, user.id);

    // Generate tokens
    const { accessToken, refreshToken } = await this.authService.generateTokens(user);

    // Set refresh token cookie
    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });

    return reply.code(201).send({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        verified: user.emailVerified,
        wallet: {
          coins: user.wallet?.coins,
          gems: user.wallet?.gems,
        },
      },
      accessToken,
    });
  }

  async login(req: FastifyRequest<{ Body: z.infer<typeof LoginSchema> }>, reply: FastifyReply) {
    const { username, password, twoFactorCode, rememberMe } = req.body;

    // Find user
    const user = await req.server.prisma.user.findFirst({
      where: {
        OR: [{ email: username }, { username }],
        status: 'ACTIVE',
      },
      include: {
        wallet: true,
      },
    });

    if (!user) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await argon2.verify(user.passwordHash, password);
    if (!isValidPassword) {
      // Log failed attempt
      await this.authService.logFailedAttempt(user.id, req.ip);
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    // Check 2FA if enabled
    if (user.twoFactorSecret) {
      if (!twoFactorCode) {
        return reply.code(200).send({
          requiresTwoFactor: true,
          message: 'Please enter your 2FA code',
        });
      }

      const isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2,
      });

      if (!isValid) {
        return reply.code(401).send({ error: 'Invalid 2FA code' });
      }
    }

    // Update last active
    await req.server.prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    // Generate tokens
    const { accessToken, refreshToken } = await this.authService.generateTokens(user);

    // Set refresh token cookie
    const maxAge = rememberMe ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge,
      path: '/',
    });

    // Track login event
    await req.server.queues.analytics.add('track', {
      event: 'user.login',
      userId: user.id,
      properties: {
        method: 'password',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    return reply.send({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        verified: user.emailVerified,
        role: user.role,
        wallet: {
          coins: user.wallet?.coins,
          gems: user.wallet?.gems,
        },
      },
      accessToken,
    });
  }

  async refreshToken(req: FastifyRequest, reply: FastifyReply) {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return reply.code(401).send({ error: 'No refresh token provided' });
    }

    try {
      // Verify refresh token
      const decoded = await req.server.jwt.verify(refreshToken);
      
      // Check if token is blacklisted
      const isBlacklisted = await req.server.redis.get(`blacklist:${refreshToken}`);
      if (isBlacklisted) {
        return reply.code(401).send({ error: 'Token has been revoked' });
      }

      // Get user
      const user = await req.server.prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { wallet: true },
      });

      if (!user || user.status !== 'ACTIVE') {
        return reply.code(401).send({ error: 'User not found or inactive' });
      }

      // Generate new tokens
      const tokens = await this.authService.generateTokens(user);

      // Rotate refresh token
      await req.server.redis.setex(
        `blacklist:${refreshToken}`,
        30 * 24 * 60 * 60, // 30 days
        '1'
      );

      reply.setCookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      return reply.send({
        accessToken: tokens.accessToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          role: user.role,
        },
      });
    } catch (error) {
      return reply.code(401).send({ error: 'Invalid refresh token' });
    }
  }

  async logout(req: FastifyRequest, reply: FastifyReply) {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Blacklist refresh token
      await req.server.redis.setex(
        `blacklist:${refreshToken}`,
        30 * 24 * 60 * 60,
        '1'
      );
    }

    // Clear cookie
    reply.clearCookie('refreshToken');

    return reply.send({ message: 'Logged out successfully' });
  }

  async setup2FA(req: FastifyRequest, reply: FastifyReply) {
    const user = req.user;

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `VoiceCast (${user.username})`,
      issuer: 'VoiceCast',
    });

    // Store secret temporarily
    await req.server.redis.setex(
      `2fa_setup:${user.id}`,
      600, // 10 minutes
      secret.base32
    );

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return reply.send({
      secret: secret.base32,
      qrCode,
      backupCodes: await this.authService.generateBackupCodes(user.id),
    });
  }

  async verify2FA(req: FastifyRequest<{ Body: { code: string } }>, reply: FastifyReply) {
    const user = req.user;
    const { code } = req.body;

    // Get temporary secret
    const secret = await req.server.redis.get(`2fa_setup:${user.id}`);
    if (!secret) {
      return reply.code(400).send({ error: '2FA setup expired' });
    }

    // Verify code
    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!isValid) {
      return reply.code(400).send({ error: 'Invalid code' });
    }

    // Save secret to user
    await req.server.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret },
    });

    // Clean up
    await req.server.redis.del(`2fa_setup:${user.id}`);

    return reply.send({ message: '2FA enabled successfully' });
  }
}

export async function authModule(fastify: FastifyInstance) {
  const authService = new AuthService(fastify.prisma, fastify.redis);
  const emailService = new EmailService(fastify.queues.email);
  const controller = new AuthController(authService, emailService);

  // Public routes
  fastify.post('/register', {
    schema: { body: RegisterSchema },
    handler: controller.register.bind(controller),
  });

  fastify.post('/login', {
    schema: { body: LoginSchema },
    handler: controller.login.bind(controller),
  });

  fastify.post('/refresh', {
    handler: controller.refreshToken.bind(controller),
  });

  fastify.post('/logout', {
    handler: controller.logout.bind(controller),
  });

  // Protected routes
  fastify.register(async function (fastify) {
    fastify.addHook('onRequest', async (req, reply) => {
      try {
        await req.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    });

    fastify.post('/2fa/setup', {
      handler: controller.setup2FA.bind(controller),
    });

    fastify.post('/2fa/verify', {
      handler: controller.verify2FA.bind(controller),
    });
  });
}
```

## Critical Requirements

1. **Security First** - Implement all security best practices
2. **Scalability** - Design for 100k+ concurrent users
3. **Performance** - Sub-100ms API response times
4. **Reliability** - 99.9% uptime with graceful degradation
5. **Monitoring** - Complete observability with metrics, logs, traces

## Additional Modules to Implement

- Streaming module with MediaSoup integration
- Chat module with real-time messaging
- Payment module with Stripe integration
- Admin module with moderation tools
- Analytics module with real-time metrics
- Notification module with push/email/SMS
- Search module with MeiliSearch integration
- CDN module with CloudFlare integration

Start by setting up the database, then implement all API endpoints with proper validation, error handling, and testing.
```
