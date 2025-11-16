import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { paginationSchema } from '../../utils/validators';
import { sanitizeHtml } from '../../utils/validators';
import { AppError } from '../../utils/error-handler';
import { WebSocket } from 'ws';

const SendMessageSchema = z.object({
  content: z.string().min(1).max(500),
  type: z.enum(['TEXT', 'EMOTE', 'SYSTEM', 'GIFT']).default('TEXT'),
  metadata: z.record(z.any()).optional(),
});

export class ChatController {
  async sendMessage(
    req: FastifyRequest<{
      Params: { streamId: string };
      Body: z.infer<typeof SendMessageSchema>;
    }>,
    reply: FastifyReply
  ) {
    const userId = req.user!.id;
    const { streamId } = req.params;
    const { content, type, metadata } = req.body;

    // Check if stream exists and allows chat
    const stream = await req.server.prisma.stream.findUnique({
      where: { id: streamId },
    });

    if (!stream) {
      throw new AppError(404, 'Stream not found', 'STREAM_NOT_FOUND');
    }

    if (!stream.allowChat) {
      throw new AppError(403, 'Chat is disabled for this stream', 'CHAT_DISABLED');
    }

    if (!stream.isLive) {
      throw new AppError(400, 'Cannot send messages to offline stream', 'STREAM_NOT_LIVE');
    }

    // Check if user is blocked
    const isBlocked = await req.server.prisma.block.findFirst({
      where: {
        blockerId: stream.hostId,
        blockedId: userId,
      },
    });

    if (isBlocked) {
      throw new AppError(403, 'You are blocked from this chat', 'USER_BLOCKED');
    }

    // Rate limiting - check Redis for message count
    const messageKey = `chat_rate_limit:${userId}:${streamId}`;
    const messageCount = await req.server.redis.incr(messageKey);

    if (messageCount === 1) {
      await req.server.redis.expire(messageKey, 10); // 10 seconds
    }

    if (messageCount > 5) {
      throw new AppError(429, 'Too many messages. Please slow down.', 'RATE_LIMITED');
    }

    // Sanitize content
    const sanitizedContent = sanitizeHtml(content);

    // Create message
    const message = await req.server.prisma.chatMessage.create({
      data: {
        streamId,
        userId,
        content: sanitizedContent,
        type,
        metadata: metadata || {},
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            verifiedStreamer: true,
            role: true,
          },
        },
      },
    });

    // Update stream message count
    await req.server.prisma.stream.update({
      where: { id: streamId },
      data: {
        totalMessages: {
          increment: 1,
        },
      },
    });

    // Publish message to Redis pub/sub
    await req.server.pubsub.publisher.publish(
      `stream:${streamId}:chat`,
      JSON.stringify(message)
    );

    return reply.code(201).send({ message });
  }

  async getMessages(
    req: FastifyRequest<{
      Params: { streamId: string };
      Querystring: z.infer<typeof paginationSchema>;
    }>,
    reply: FastifyReply
  ) {
    const { streamId } = req.params;
    const { page, limit } = req.query;

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      req.server.prisma.chatMessage.findMany({
        where: {
          streamId,
          deleted: false,
        },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              verifiedStreamer: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      req.server.prisma.chatMessage.count({
        where: {
          streamId,
          deleted: false,
        },
      }),
    ]);

    return reply.send({
      messages: messages.reverse(), // Show oldest first
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }

  async deleteMessage(
    req: FastifyRequest<{
      Params: { streamId: string; messageId: string };
    }>,
    reply: FastifyReply
  ) {
    const userId = req.user!.id;
    const { streamId, messageId } = req.params;

    const message = await req.server.prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        stream: true,
      },
    });

    if (!message) {
      throw new AppError(404, 'Message not found', 'MESSAGE_NOT_FOUND');
    }

    // Check permissions - must be message owner, stream host, or moderator
    const isModerator = await req.server.prisma.streamModerator.findFirst({
      where: {
        streamId,
        userId,
        canDeleteMessages: true,
      },
    });

    const canDelete =
      message.userId === userId ||
      message.stream.hostId === userId ||
      isModerator !== null ||
      req.user!.role === 'ADMIN' ||
      req.user!.role === 'SUPER_ADMIN';

    if (!canDelete) {
      throw new AppError(403, 'You do not have permission to delete this message', 'FORBIDDEN');
    }

    // Soft delete
    await req.server.prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        deleted: true,
        deletedAt: new Date(),
      },
    });

    // Publish deletion event
    await req.server.pubsub.publisher.publish(
      `stream:${streamId}:chat`,
      JSON.stringify({
        type: 'MESSAGE_DELETED',
        messageId,
      })
    );

    return reply.send({ message: 'Message deleted successfully' });
  }

  async handleWebSocket(connection: WebSocket, req: FastifyRequest) {
    const streamId = req.query.streamId as string;
    const userId = req.user?.id;

    if (!streamId) {
      connection.close(1008, 'Stream ID required');
      return;
    }

    // Subscribe to stream chat
    const subscriber = req.server.pubsub.subscriber.duplicate();
    await subscriber.subscribe(`stream:${streamId}:chat`);

    // Send initial connection message
    connection.send(
      JSON.stringify({
        type: 'CONNECTED',
        streamId,
        timestamp: new Date().toISOString(),
      })
    );

    // Handle incoming messages
    connection.on('message', async (data) => {
      try {
        const payload = JSON.parse(data.toString());

        if (payload.type === 'PING') {
          connection.send(JSON.stringify({ type: 'PONG' }));
          return;
        }

        // Handle other message types as needed
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    // Forward Redis messages to WebSocket
    subscriber.on('message', (channel, message) => {
      if (connection.readyState === WebSocket.OPEN) {
        connection.send(message);
      }
    });

    // Clean up on disconnect
    connection.on('close', async () => {
      await subscriber.unsubscribe();
      await subscriber.quit();
    });
  }
}

export async function chatModule(fastify: FastifyInstance) {
  const controller = new ChatController();

  // Public routes
  fastify.get('/:streamId/messages', {
    schema: {
      querystring: paginationSchema,
    },
    handler: controller.getMessages.bind(controller),
  });

  // WebSocket endpoint
  fastify.get('/ws', { websocket: true }, async (connection, req) => {
    await controller.handleWebSocket(connection, req);
  });

  // Protected routes
  fastify.register(async function (protectedFastify) {
    protectedFastify.addHook('onRequest', async (req, reply) => {
      try {
        await req.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    });

    protectedFastify.post('/:streamId/messages', {
      schema: { body: SendMessageSchema },
      handler: controller.sendMessage.bind(controller),
    });

    protectedFastify.delete('/:streamId/messages/:messageId', {
      handler: controller.deleteMessage.bind(controller),
    });
  });
}
