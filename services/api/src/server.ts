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
    log: config.isDev ? ['query', 'error', 'warn'] : ['error'],
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
    max: config.rateLimit.global.max,
    timeWindow: config.rateLimit.global.timeWindow,
    cache: 10000,
    skipOnError: false,
    redis: redis,
    keyGenerator: (req) => {
      return (
        (req.headers['x-forwarded-for'] as string) ||
        req.socket?.remoteAddress ||
        req.ip
      );
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

    const isHealthy = checks.every((check) => check.status === 'fulfilled');

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

  // API info
  fastify.get('/', async () => {
    return {
      name: 'VoiceCast API',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
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
  createServer().then((fastify) => {
    fastify.listen(
      {
        port: config.port,
        host: config.host,
      },
      (err) => {
        if (err) {
          logger.error(err);
          process.exit(1);
        }
      }
    );
  });
}
