import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { logger } from './logger';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export async function errorHandler(
  error: FastifyError | AppError | ZodError | Prisma.PrismaClientKnownRequestError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log error
  logger.error({
    err: error,
    req: request,
    url: request.url,
    method: request.method,
  });

  // Zod validation error
  if (error instanceof ZodError) {
    return reply.code(400).send({
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      details: error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return reply.code(409).send({
        error: 'Conflict',
        code: 'DUPLICATE_ENTRY',
        message: 'A record with this value already exists',
        details: error.meta,
      });
    }

    if (error.code === 'P2025') {
      return reply.code(404).send({
        error: 'Not Found',
        code: 'RECORD_NOT_FOUND',
        message: 'The requested record was not found',
      });
    }

    return reply.code(500).send({
      error: 'Database Error',
      code: error.code,
      message: 'A database error occurred',
    });
  }

  // Custom app error
  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      error: error.message,
      code: error.code,
      details: error.details,
    });
  }

  // Fastify errors
  if ('statusCode' in error) {
    const statusCode = error.statusCode || 500;

    return reply.code(statusCode).send({
      error: error.message,
      code: error.code,
    });
  }

  // Generic error
  return reply.code(500).send({
    error: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
  });
}
