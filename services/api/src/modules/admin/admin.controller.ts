import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { paginationSchema } from '../../utils/validators';
import { AppError } from '../../utils/error-handler';

const UpdateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED', 'DELETED']),
  reason: z.string().optional(),
});

const UpdateUserRoleSchema = z.object({
  role: z.enum(['USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN']),
});

const ResolveReportSchema = z.object({
  resolution: z.string(),
  action: z.enum(['DISMISS', 'WARNING', 'SUSPEND', 'BAN']),
});

export class AdminController {
  // Middleware to check admin permissions
  private async checkAdminPermission(req: FastifyRequest, reply: FastifyReply, minRole: string = 'ADMIN') {
    const user = req.user!;
    const roles = ['USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'];
    const userRoleIndex = roles.indexOf(user.role);
    const minRoleIndex = roles.indexOf(minRole);

    if (userRoleIndex < minRoleIndex) {
      throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
    }
  }

  async getDashboardStats(req: FastifyRequest, reply: FastifyReply) {
    await this.checkAdminPermission(req, reply);

    const [
      totalUsers,
      activeUsers,
      totalStreams,
      liveStreams,
      totalRevenue,
      pendingReports,
    ] = await Promise.all([
      req.server.prisma.user.count(),
      req.server.prisma.user.count({
        where: {
          status: 'ACTIVE',
          lastActiveAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
      req.server.prisma.stream.count(),
      req.server.prisma.stream.count({ where: { isLive: true } }),
      req.server.prisma.transaction.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      req.server.prisma.report.count({ where: { status: 'PENDING' } }),
    ]);

    return reply.send({
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
        },
        streams: {
          total: totalStreams,
          live: liveStreams,
        },
        revenue: {
          total: totalRevenue._sum.amount || 0,
        },
        reports: {
          pending: pendingReports,
        },
      },
    });
  }

  async listUsers(
    req: FastifyRequest<{
      Querystring: z.infer<typeof paginationSchema> & {
        status?: string;
        role?: string;
        search?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    await this.checkAdminPermission(req, reply);

    const { page, limit, status, role, search } = req.query;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(status && { status }),
      ...(role && { role }),
      ...(search && {
        OR: [
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { displayName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      req.server.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          avatar: true,
          status: true,
          role: true,
          verifiedStreamer: true,
          createdAt: true,
          lastActiveAt: true,
          _count: {
            select: {
              streams: true,
              followers: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      req.server.prisma.user.count({ where }),
    ]);

    return reply.send({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }

  async updateUserStatus(
    req: FastifyRequest<{
      Params: { userId: string };
      Body: z.infer<typeof UpdateUserStatusSchema>;
    }>,
    reply: FastifyReply
  ) {
    await this.checkAdminPermission(req, reply, 'MODERATOR');

    const { userId } = req.params;
    const { status, reason } = req.body;

    const user = await req.server.prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    // Log the action
    await req.server.prisma.activity.create({
      data: {
        userId: req.user!.id,
        type: 'SETTINGS_CHANGE',
        action: 'user_status_updated',
        targetType: 'user',
        targetId: userId,
        metadata: {
          newStatus: status,
          reason,
        },
      },
    });

    return reply.send({ user });
  }

  async updateUserRole(
    req: FastifyRequest<{
      Params: { userId: string };
      Body: z.infer<typeof UpdateUserRoleSchema>;
    }>,
    reply: FastifyReply
  ) {
    await this.checkAdminPermission(req, reply, 'SUPER_ADMIN');

    const { userId } = req.params;
    const { role } = req.body;

    const user = await req.server.prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    // Log the action
    await req.server.prisma.activity.create({
      data: {
        userId: req.user!.id,
        type: 'SETTINGS_CHANGE',
        action: 'user_role_updated',
        targetType: 'user',
        targetId: userId,
        metadata: {
          newRole: role,
        },
      },
    });

    return reply.send({ user });
  }

  async listReports(
    req: FastifyRequest<{
      Querystring: z.infer<typeof paginationSchema> & {
        status?: string;
        type?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    await this.checkAdminPermission(req, reply, 'MODERATOR');

    const { page, limit, status, type } = req.query;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(status && { status }),
      ...(type && { type }),
    };

    const [reports, total] = await Promise.all([
      req.server.prisma.report.findMany({
        where,
        skip,
        take: limit,
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          reported: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      req.server.prisma.report.count({ where }),
    ]);

    return reply.send({
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }

  async resolveReport(
    req: FastifyRequest<{
      Params: { reportId: string };
      Body: z.infer<typeof ResolveReportSchema>;
    }>,
    reply: FastifyReply
  ) {
    await this.checkAdminPermission(req, reply, 'MODERATOR');

    const { reportId } = req.params;
    const { resolution, action } = req.body;

    const report = await req.server.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new AppError(404, 'Report not found', 'REPORT_NOT_FOUND');
    }

    // Update report
    await req.server.prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'RESOLVED',
        resolution,
        resolvedBy: req.user!.id,
        resolvedAt: new Date(),
      },
    });

    // Take action based on decision
    if (action === 'SUSPEND') {
      await req.server.prisma.user.update({
        where: { id: report.reportedId },
        data: { status: 'SUSPENDED' },
      });
    } else if (action === 'BAN') {
      await req.server.prisma.user.update({
        where: { id: report.reportedId },
        data: { status: 'BANNED' },
      });
    }

    // Log the action
    await req.server.prisma.activity.create({
      data: {
        userId: req.user!.id,
        type: 'SETTINGS_CHANGE',
        action: 'report_resolved',
        targetType: 'report',
        targetId: reportId,
        metadata: {
          action,
          resolution,
        },
      },
    });

    return reply.send({ message: 'Report resolved successfully' });
  }

  async verifyStreamer(
    req: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ) {
    await this.checkAdminPermission(req, reply);

    const { userId } = req.params;

    const user = await req.server.prisma.user.update({
      where: { id: userId },
      data: { verifiedStreamer: true },
    });

    // Send notification
    await req.server.queues.notification.add('send', {
      userId,
      type: 'streamer_verified',
      data: {},
    });

    return reply.send({ user });
  }

  async setPartnerStatus(
    req: FastifyRequest<{
      Params: { userId: string };
      Body: { partnered: boolean };
    }>,
    reply: FastifyReply
  ) {
    await this.checkAdminPermission(req, reply, 'SUPER_ADMIN');

    const { userId } = req.params;
    const { partnered } = req.body;

    const user = await req.server.prisma.user.update({
      where: { id: userId },
      data: { partnered },
    });

    return reply.send({ user });
  }

  async getSystemMetrics(req: FastifyRequest, reply: FastifyReply) {
    await this.checkAdminPermission(req, reply, 'SUPER_ADMIN');

    // Get system health metrics
    const metrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      timestamp: new Date().toISOString(),
    };

    // Get database connection pool stats
    const dbStats = await req.server.prisma.$queryRaw`
      SELECT count(*) as total_connections
      FROM pg_stat_activity
      WHERE datname = current_database()
    `;

    // Get Redis stats
    const redisInfo = await req.server.redis.info('stats');

    return reply.send({
      system: metrics,
      database: dbStats,
      redis: redisInfo,
    });
  }
}

export async function adminModule(fastify: FastifyInstance) {
  const controller = new AdminController();

  // All admin routes require authentication
  fastify.register(async function (adminFastify) {
    adminFastify.addHook('onRequest', async (req, reply) => {
      try {
        await req.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    });

    adminFastify.get('/dashboard', {
      handler: controller.getDashboardStats.bind(controller),
    });

    adminFastify.get('/users', {
      schema: { querystring: paginationSchema },
      handler: controller.listUsers.bind(controller),
    });

    adminFastify.patch('/users/:userId/status', {
      schema: { body: UpdateUserStatusSchema },
      handler: controller.updateUserStatus.bind(controller),
    });

    adminFastify.patch('/users/:userId/role', {
      schema: { body: UpdateUserRoleSchema },
      handler: controller.updateUserRole.bind(controller),
    });

    adminFastify.post('/users/:userId/verify', {
      handler: controller.verifyStreamer.bind(controller),
    });

    adminFastify.patch('/users/:userId/partner', {
      handler: controller.setPartnerStatus.bind(controller),
    });

    adminFastify.get('/reports', {
      schema: { querystring: paginationSchema },
      handler: controller.listReports.bind(controller),
    });

    adminFastify.post('/reports/:reportId/resolve', {
      schema: { body: ResolveReportSchema },
      handler: controller.resolveReport.bind(controller),
    });

    adminFastify.get('/system/metrics', {
      handler: controller.getSystemMetrics.bind(controller),
    });
  });
}
