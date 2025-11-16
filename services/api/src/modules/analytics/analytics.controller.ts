import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AppError } from '../../utils/error-handler';

const DateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

const TrackEventSchema = z.object({
  event: z.string(),
  properties: z.record(z.any()).optional(),
});

export class AnalyticsController {
  async getStreamAnalytics(
    req: FastifyRequest<{
      Params: { streamId: string };
      Querystring: z.infer<typeof DateRangeSchema>;
    }>,
    reply: FastifyReply
  ) {
    const userId = req.user?.id;
    const { streamId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify stream ownership
    const stream = await req.server.prisma.stream.findUnique({
      where: { id: streamId },
    });

    if (!stream) {
      throw new AppError(404, 'Stream not found', 'STREAM_NOT_FOUND');
    }

    if (userId && stream.hostId !== userId) {
      throw new AppError(403, 'You do not own this stream', 'FORBIDDEN');
    }

    // Get analytics data
    const analytics = await req.server.prisma.streamAnalytics.findMany({
      where: {
        streamId,
        timestamp: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Calculate aggregate metrics
    const totalViews = analytics.reduce((sum, a) => sum + a.uniqueViewers, 0);
    const avgViewerCount =
      analytics.reduce((sum, a) => sum + a.viewerCount, 0) / (analytics.length || 1);
    const peakViewers = Math.max(...analytics.map((a) => a.peakViewers), 0);
    const totalRevenue = analytics.reduce((sum, a) => sum + Number(a.revenue), 0);
    const totalMessages = analytics.reduce((sum, a) => sum + a.chatMessages, 0);
    const avgWatchTime =
      analytics.reduce((sum, a) => sum + a.avgWatchTime, 0) / (analytics.length || 1);

    return reply.send({
      analytics: {
        timeSeries: analytics,
        summary: {
          totalViews,
          avgViewerCount: Math.round(avgViewerCount),
          peakViewers,
          totalRevenue,
          totalMessages,
          avgWatchTime: Math.round(avgWatchTime),
        },
      },
    });
  }

  async getUserAnalytics(
    req: FastifyRequest<{
      Querystring: z.infer<typeof DateRangeSchema>;
    }>,
    reply: FastifyReply
  ) {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    // Get user's streams
    const streams = await req.server.prisma.stream.findMany({
      where: {
        hostId: userId,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      select: {
        id: true,
        title: true,
        peakViewers: true,
        totalViewers: true,
        totalMessages: true,
        totalGifts: true,
        totalRevenue: true,
        duration: true,
        createdAt: true,
      },
    });

    // Get follower growth
    const followerGrowth = await req.server.prisma.follow.groupBy({
      by: ['createdAt'],
      where: {
        followingId: userId,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      _count: true,
    });

    // Get revenue breakdown
    const revenueBreakdown = await req.server.prisma.transaction.groupBy({
      by: ['type'],
      where: {
        userId,
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Calculate totals
    const totalStreams = streams.length;
    const totalViewers = streams.reduce((sum, s) => sum + s.totalViewers, 0);
    const totalMessages = streams.reduce((sum, s) => sum + s.totalMessages, 0);
    const totalGifts = streams.reduce((sum, s) => sum + s.totalGifts, 0);
    const totalRevenue = streams.reduce((sum, s) => sum + Number(s.totalRevenue), 0);
    const totalDuration = streams.reduce((sum, s) => sum + s.duration, 0);
    const avgViewers = totalViewers / (totalStreams || 1);

    return reply.send({
      analytics: {
        summary: {
          totalStreams,
          totalViewers,
          avgViewers: Math.round(avgViewers),
          totalMessages,
          totalGifts,
          totalRevenue,
          totalDuration,
          avgDuration: Math.round(totalDuration / (totalStreams || 1)),
        },
        streams,
        followerGrowth,
        revenueBreakdown: revenueBreakdown.map((r) => ({
          type: r.type,
          amount: r._sum.amount || 0,
        })),
      },
    });
  }

  async trackEvent(
    req: FastifyRequest<{ Body: z.infer<typeof TrackEventSchema> }>,
    reply: FastifyReply
  ) {
    const userId = req.user?.id;
    const { event, properties } = req.body;

    // Queue event for processing
    await req.server.queues.analytics.add('track', {
      event,
      userId,
      properties: {
        ...properties,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString(),
      },
    });

    return reply.code(204).send();
  }

  async getTopStreams(
    req: FastifyRequest<{
      Querystring: {
        period: 'day' | 'week' | 'month' | 'year';
        limit?: number;
      };
    }>,
    reply: FastifyReply
  ) {
    const { period, limit = 10 } = req.query;

    // Calculate date range
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const topStreams = await req.server.prisma.stream.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      take: limit,
      orderBy: [{ peakViewers: 'desc' }, { totalViewers: 'desc' }],
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
      },
    });

    return reply.send({ topStreams });
  }

  async getTopStreamers(
    req: FastifyRequest<{
      Querystring: {
        period: 'day' | 'week' | 'month' | 'year';
        limit?: number;
      };
    }>,
    reply: FastifyReply
  ) {
    const { period, limit = 10 } = req.query;

    // Calculate date range
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Get top streamers by total viewers
    const topStreamers = await req.server.prisma.user.findMany({
      where: {
        streams: {
          some: {
            createdAt: {
              gte: startDate,
            },
          },
        },
      },
      take: limit,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        verifiedStreamer: true,
        partnered: true,
        _count: {
          select: {
            followers: true,
          },
        },
        streams: {
          where: {
            createdAt: {
              gte: startDate,
            },
          },
          select: {
            totalViewers: true,
            totalRevenue: true,
            peakViewers: true,
          },
        },
      },
      orderBy: {
        followers: {
          _count: 'desc',
        },
      },
    });

    const streamersWithStats = topStreamers.map((streamer) => {
      const totalViewers = streamer.streams.reduce((sum, s) => sum + s.totalViewers, 0);
      const totalRevenue = streamer.streams.reduce((sum, s) => sum + Number(s.totalRevenue), 0);
      const peakViewers = Math.max(...streamer.streams.map((s) => s.peakViewers), 0);

      return {
        id: streamer.id,
        username: streamer.username,
        displayName: streamer.displayName,
        avatar: streamer.avatar,
        verifiedStreamer: streamer.verifiedStreamer,
        partnered: streamer.partnered,
        followers: streamer._count.followers,
        stats: {
          totalViewers,
          totalRevenue,
          peakViewers,
          streamCount: streamer.streams.length,
        },
      };
    });

    return reply.send({ topStreamers: streamersWithStats });
  }

  async getRealtimeStats(req: FastifyRequest, reply: FastifyReply) {
    // Get current live streams stats
    const liveStreams = await req.server.prisma.stream.findMany({
      where: { isLive: true },
      include: {
        _count: {
          select: {
            viewers: true,
          },
        },
      },
    });

    const totalLiveStreams = liveStreams.length;
    const totalLiveViewers = liveStreams.reduce((sum, s) => sum + s._count.viewers, 0);

    // Get recent activities (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const [recentSignups, recentGifts, recentMessages] = await Promise.all([
      req.server.prisma.user.count({
        where: {
          createdAt: {
            gte: oneHourAgo,
          },
        },
      }),
      req.server.prisma.gift.count({
        where: {
          createdAt: {
            gte: oneHourAgo,
          },
        },
      }),
      req.server.prisma.chatMessage.count({
        where: {
          createdAt: {
            gte: oneHourAgo,
          },
        },
      }),
    ]);

    return reply.send({
      realtime: {
        liveStreams: totalLiveStreams,
        liveViewers: totalLiveViewers,
        lastHour: {
          signups: recentSignups,
          gifts: recentGifts,
          messages: recentMessages,
        },
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export async function analyticsModule(fastify: FastifyInstance) {
  const controller = new AnalyticsController();

  // Public routes
  fastify.get('/top-streams', {
    handler: controller.getTopStreams.bind(controller),
  });

  fastify.get('/top-streamers', {
    handler: controller.getTopStreamers.bind(controller),
  });

  fastify.get('/realtime', {
    handler: controller.getRealtimeStats.bind(controller),
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

    protectedFastify.get('/streams/:streamId', {
      schema: { querystring: DateRangeSchema },
      handler: controller.getStreamAnalytics.bind(controller),
    });

    protectedFastify.get('/user', {
      schema: { querystring: DateRangeSchema },
      handler: controller.getUserAnalytics.bind(controller),
    });

    protectedFastify.post('/track', {
      schema: { body: TrackEventSchema },
      handler: controller.trackEvent.bind(controller),
    });
  });
}
