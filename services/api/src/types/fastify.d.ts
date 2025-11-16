import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { Queue } from 'bullmq';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    redis: Redis;
    pubsub: {
      publisher: Redis;
      subscriber: Redis;
    };
    queues: {
      email: Queue;
      notification: Queue;
      analytics: Queue;
      media: Queue;
      payout: Queue;
    };
  }

  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      username: string;
      role: string;
    };
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      userId: string;
      email: string;
      username: string;
      role: string;
    };
    user: {
      id: string;
      email: string;
      username: string;
      role: string;
    };
  }
}
