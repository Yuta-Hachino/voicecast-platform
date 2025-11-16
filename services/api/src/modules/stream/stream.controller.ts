import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { paginationSchema, sortSchema } from '../../utils/validators';
import { AppError } from '../../utils/error-handler';
import { randomBytes } from 'crypto';

const CreateStreamSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  categoryId: z.string().cuid().optional(),
  tags: z.array(z.string()).max(10).optional(),
  visibility: z.enum(['PUBLIC', 'FOLLOWERS_ONLY', 'SUBSCRIBERS_ONLY', 'PRIVATE']).default('PUBLIC'),
  audioQuality: z.enum(['LOW', 'MEDIUM', 'HIGH', 'ULTRA']).default('HIGH'),
  allowChat: z.boolean().default(true),
  allowGifts: z.boolean().default(true),
  subscribersOnly: z.boolean().default(false),
  ageRestricted: z.boolean().default(false),
  recordingEnabled: z.boolean().default(false),
  scheduledFor: z.string().datetime().optional(),
});

const UpdateStreamSchema = CreateStreamSchema.partial();

const StreamFiltersSchema = z.object({
  categoryId: z.string().cuid().optional(),
  isLive: z.coerce.boolean().optional(),
  visibility: z.enum(['PUBLIC', 'FOLLOWERS_ONLY', 'SUBSCRIBERS_ONLY', 'PRIVATE']).optional(),
  search: z.string().optional(),
});

export class StreamController {
  async createStream(
    req: FastifyRequest<{ Body: z.infer<typeof CreateStreamSchema> }>,
    reply: FastifyReply
  ) {
    const userId = req.user!.id;
    const { tags, ...streamData } = req.body;

    // Check if user already has an active stream
    const existingStream = await req.server.prisma.stream.findFirst({
      where: {
        hostId: userId,
        isLive: true,
      },
    });

    if (existingStream) {
      throw new AppError(409, 'You already have an active stream', 'STREAM_ALREADY_EXISTS');
    }

    // Generate unique stream key
    const streamKey = randomBytes(32).toString('hex');

    // Create stream
    const stream = await req.server.prisma.stream.create({
      data: {
        ...streamData,
        hostId: userId,
        streamKey,
        tags: tags
          ? {
              connectOrCreate: tags.map((tag) => ({
                where: { slug: tag.toLowerCase().replace(/\s+/g, '-') },
                create: {
                  name: tag,
                  slug: tag.toLowerCase().replace(/\s+/g, '-'),
                },
              })),
            }
          : undefined,
      },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            verifiedStreamer: true,
          },
        },
        category: true,
        tags: true,
      },
    });

    // Track stream creation
    await req.server.queues.analytics.add('track', {
      event: 'stream.created',
      userId,
      properties: {
        streamId: stream.id,
        scheduled: !!stream.scheduledFor,
      },
    });

    return reply.code(201).send({ stream });
  }

  async getStream(req: FastifyRequest<{ Params: { streamId: string } }>, reply: FastifyReply) {
    const { streamId } = req.params;

    const stream = await req.server.prisma.stream.findUnique({
      where: { id: streamId },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            verifiedStreamer: true,
            partnered: true,
          },
        },
        category: true,
        tags: true,
        _count: {
          select: {
            viewers: true,
            messages: true,
            gifts: true,
          },
        },
      },
    });

    if (!stream) {
      throw new AppError(404, 'Stream not found', 'STREAM_NOT_FOUND');
    }

    // Check access permissions
    const userId = req.user?.id;
    if (stream.visibility !== 'PUBLIC') {
      if (!userId) {
        throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
      }

      if (stream.visibility === 'FOLLOWERS_ONLY') {
        const isFollowing = await req.server.prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: userId,
              followingId: stream.hostId,
            },
          },
        });

        if (!isFollowing && userId !== stream.hostId) {
          throw new AppError(403, 'This stream is for followers only', 'FORBIDDEN');
        }
      }

      if (stream.visibility === 'SUBSCRIBERS_ONLY') {
        const isSubscriber = await req.server.prisma.subscription.findFirst({
          where: {
            subscriberId: userId,
            creatorId: stream.hostId,
            status: 'ACTIVE',
          },
        });

        if (!isSubscriber && userId !== stream.hostId) {
          throw new AppError(403, 'This stream is for subscribers only', 'FORBIDDEN');
        }
      }
    }

    return reply.send({
      stream: {
        ...stream,
        currentViewers: stream._count.viewers,
        totalMessages: stream._count.messages,
        totalGifts: stream._count.gifts,
      },
    });
  }

  async updateStream(
    req: FastifyRequest<{
      Params: { streamId: string };
      Body: z.infer<typeof UpdateStreamSchema>;
    }>,
    reply: FastifyReply
  ) {
    const userId = req.user!.id;
    const { streamId } = req.params;
    const { tags, ...updates } = req.body;

    // Verify ownership
    const stream = await req.server.prisma.stream.findUnique({
      where: { id: streamId },
    });

    if (!stream) {
      throw new AppError(404, 'Stream not found', 'STREAM_NOT_FOUND');
    }

    if (stream.hostId !== userId) {
      throw new AppError(403, 'You do not own this stream', 'FORBIDDEN');
    }

    // Update stream
    const updatedStream = await req.server.prisma.stream.update({
      where: { id: streamId },
      data: {
        ...updates,
        tags: tags
          ? {
              set: [],
              connectOrCreate: tags.map((tag) => ({
                where: { slug: tag.toLowerCase().replace(/\s+/g, '-') },
                create: {
                  name: tag,
                  slug: tag.toLowerCase().replace(/\s+/g, '-'),
                },
              })),
            }
          : undefined,
      },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        category: true,
        tags: true,
      },
    });

    return reply.send({ stream: updatedStream });
  }

  async deleteStream(req: FastifyRequest<{ Params: { streamId: string } }>, reply: FastifyReply) {
    const userId = req.user!.id;
    const { streamId } = req.params;

    // Verify ownership
    const stream = await req.server.prisma.stream.findUnique({
      where: { id: streamId },
    });

    if (!stream) {
      throw new AppError(404, 'Stream not found', 'STREAM_NOT_FOUND');
    }

    if (stream.hostId !== userId) {
      throw new AppError(403, 'You do not own this stream', 'FORBIDDEN');
    }

    if (stream.isLive) {
      throw new AppError(400, 'Cannot delete a live stream', 'STREAM_IS_LIVE');
    }

    await req.server.prisma.stream.delete({
      where: { id: streamId },
    });

    return reply.send({ message: 'Stream deleted successfully' });
  }

  async startStream(req: FastifyRequest<{ Params: { streamId: string } }>, reply: FastifyReply) {
    const userId = req.user!.id;
    const { streamId } = req.params;

    const stream = await req.server.prisma.stream.findUnique({
      where: { id: streamId },
    });

    if (!stream) {
      throw new AppError(404, 'Stream not found', 'STREAM_NOT_FOUND');
    }

    if (stream.hostId !== userId) {
      throw new AppError(403, 'You do not own this stream', 'FORBIDDEN');
    }

    if (stream.isLive) {
      throw new AppError(409, 'Stream is already live', 'STREAM_ALREADY_LIVE');
    }

    const updatedStream = await req.server.prisma.stream.update({
      where: { id: streamId },
      data: {
        isLive: true,
        actualStartTime: new Date(),
      },
    });

    // Notify followers
    await req.server.queues.notification.add('stream-started', {
      streamId,
      hostId: userId,
    });

    // Track analytics
    await req.server.queues.analytics.add('track', {
      event: 'stream.started',
      userId,
      properties: {
        streamId,
      },
    });

    return reply.send({ stream: updatedStream });
  }

  async endStream(req: FastifyRequest<{ Params: { streamId: string } }>, reply: FastifyReply) {
    const userId = req.user!.id;
    const { streamId } = req.params;

    const stream = await req.server.prisma.stream.findUnique({
      where: { id: streamId },
    });

    if (!stream) {
      throw new AppError(404, 'Stream not found', 'STREAM_NOT_FOUND');
    }

    if (stream.hostId !== userId) {
      throw new AppError(403, 'You do not own this stream', 'FORBIDDEN');
    }

    if (!stream.isLive) {
      throw new AppError(400, 'Stream is not live', 'STREAM_NOT_LIVE');
    }

    const endTime = new Date();
    const duration = stream.actualStartTime
      ? Math.floor((endTime.getTime() - stream.actualStartTime.getTime()) / 1000)
      : 0;

    const updatedStream = await req.server.prisma.stream.update({
      where: { id: streamId },
      data: {
        isLive: false,
        endedAt: endTime,
        duration,
      },
    });

    // Track analytics
    await req.server.queues.analytics.add('track', {
      event: 'stream.ended',
      userId,
      properties: {
        streamId,
        duration,
        peakViewers: stream.peakViewers,
        totalRevenue: stream.totalRevenue,
      },
    });

    return reply.send({ stream: updatedStream });
  }

  async listStreams(
    req: FastifyRequest<{
      Querystring: z.infer<typeof paginationSchema> &
        z.infer<typeof sortSchema> &
        z.infer<typeof StreamFiltersSchema>;
    }>,
    reply: FastifyReply
  ) {
    const { page, limit, sortBy, sortOrder, categoryId, isLive, visibility, search } = req.query;

    const skip = (page - 1) * limit;

    const where: any = {
      ...(categoryId && { categoryId }),
      ...(isLive !== undefined && { isLive }),
      ...(visibility && { visibility }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [streams, total] = await Promise.all([
      req.server.prisma.stream.findMany({
        where,
        skip,
        take: limit,
        include: {
          host: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              verifiedStreamer: true,
            },
          },
          category: true,
          tags: true,
          _count: {
            select: {
              viewers: true,
            },
          },
        },
        orderBy: sortBy
          ? { [sortBy]: sortOrder }
          : [{ isLive: 'desc' }, { peakViewers: 'desc' }, { createdAt: 'desc' }],
      }),
      req.server.prisma.stream.count({ where }),
    ]);

    return reply.send({
      streams: streams.map((stream) => ({
        ...stream,
        currentViewers: stream._count.viewers,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }

  async getLiveStreams(
    req: FastifyRequest<{
      Querystring: z.infer<typeof paginationSchema>;
    }>,
    reply: FastifyReply
  ) {
    const { page, limit } = req.query;
    const skip = (page - 1) * limit;

    const [streams, total] = await Promise.all([
      req.server.prisma.stream.findMany({
        where: {
          isLive: true,
          visibility: 'PUBLIC',
        },
        skip,
        take: limit,
        include: {
          host: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              verifiedStreamer: true,
            },
          },
          category: true,
          tags: true,
          _count: {
            select: {
              viewers: true,
            },
          },
        },
        orderBy: [{ peakViewers: 'desc' }, { actualStartTime: 'desc' }],
      }),
      req.server.prisma.stream.count({
        where: {
          isLive: true,
          visibility: 'PUBLIC',
        },
      }),
    ]);

    return reply.send({
      streams: streams.map((stream) => ({
        ...stream,
        currentViewers: stream._count.viewers,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }
}

export async function streamModule(fastify: FastifyInstance) {
  const controller = new StreamController();

  // Public routes
  fastify.get('/', {
    schema: {
      querystring: paginationSchema.merge(sortSchema).merge(StreamFiltersSchema),
    },
    handler: controller.listStreams.bind(controller),
  });

  fastify.get('/live', {
    schema: {
      querystring: paginationSchema,
    },
    handler: controller.getLiveStreams.bind(controller),
  });

  fastify.get('/:streamId', {
    handler: controller.getStream.bind(controller),
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

    protectedFastify.post('/', {
      schema: { body: CreateStreamSchema },
      handler: controller.createStream.bind(controller),
    });

    protectedFastify.patch('/:streamId', {
      schema: { body: UpdateStreamSchema },
      handler: controller.updateStream.bind(controller),
    });

    protectedFastify.delete('/:streamId', {
      handler: controller.deleteStream.bind(controller),
    });

    protectedFastify.post('/:streamId/start', {
      handler: controller.startStream.bind(controller),
    });

    protectedFastify.post('/:streamId/end', {
      handler: controller.endStream.bind(controller),
    });
  });
}
