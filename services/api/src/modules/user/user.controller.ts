import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { paginationSchema, displayNameSchema } from '../../utils/validators';
import { AppError } from '../../utils/error-handler';

const UpdateProfileSchema = z.object({
  displayName: displayNameSchema.optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  banner: z.string().url().optional(),
  country: z.string().length(2).optional(),
  language: z.string().max(5).optional(),
  timezone: z.string().optional(),
});

const UpdateSettingsSchema = z.object({
  privacy: z.record(z.any()).optional(),
  notifications: z.record(z.any()).optional(),
  streamSettings: z.record(z.any()).optional(),
});

export class UserController {
  async getProfile(req: FastifyRequest<{ Params: { username: string } }>, reply: FastifyReply) {
    const { username } = req.params;

    const user = await req.server.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        banner: true,
        bio: true,
        country: true,
        verifiedStreamer: true,
        partnered: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            streams: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    return reply.send({
      user: {
        ...user,
        followers: user._count.followers,
        following: user._count.following,
        totalStreams: user._count.streams,
      },
    });
  }

  async getCurrentUser(req: FastifyRequest, reply: FastifyReply) {
    const userId = req.user!.id;

    const user = await req.server.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    return reply.send({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        banner: user.banner,
        bio: user.bio,
        country: user.country,
        language: user.language,
        timezone: user.timezone,
        status: user.status,
        role: user.role,
        verifiedStreamer: user.verifiedStreamer,
        partnered: user.partnered,
        emailVerified: user.emailVerified,
        privacy: user.privacy,
        notifications: user.notifications,
        streamSettings: user.streamSettings,
        wallet: user.wallet
          ? {
              coins: user.wallet.coins,
              gems: user.wallet.gems,
              earnings: user.wallet.earnings,
            }
          : null,
        createdAt: user.createdAt,
        lastActiveAt: user.lastActiveAt,
      },
    });
  }

  async updateProfile(
    req: FastifyRequest<{ Body: z.infer<typeof UpdateProfileSchema> }>,
    reply: FastifyReply
  ) {
    const userId = req.user!.id;
    const updates = req.body;

    const user = await req.server.prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        banner: true,
        bio: true,
        country: true,
        language: true,
        timezone: true,
      },
    });

    // Track profile update
    await req.server.queues.analytics.add('track', {
      event: 'profile.updated',
      userId,
      properties: {
        fields: Object.keys(updates),
      },
    });

    return reply.send({ user });
  }

  async updateSettings(
    req: FastifyRequest<{ Body: z.infer<typeof UpdateSettingsSchema> }>,
    reply: FastifyReply
  ) {
    const userId = req.user!.id;
    const { privacy, notifications, streamSettings } = req.body;

    const updates: any = {};
    if (privacy) updates.privacy = privacy;
    if (notifications) updates.notifications = notifications;
    if (streamSettings) updates.streamSettings = streamSettings;

    await req.server.prisma.user.update({
      where: { id: userId },
      data: updates,
    });

    return reply.send({ message: 'Settings updated successfully' });
  }

  async followUser(req: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) {
    const followerId = req.user!.id;
    const { userId: followingId } = req.params;

    if (followerId === followingId) {
      throw new AppError(400, 'Cannot follow yourself', 'INVALID_OPERATION');
    }

    // Check if already following
    const existing = await req.server.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existing) {
      throw new AppError(409, 'Already following this user', 'ALREADY_FOLLOWING');
    }

    await req.server.prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });

    // Track follow event
    await req.server.queues.analytics.add('track', {
      event: 'user.followed',
      userId: followerId,
      properties: {
        followingId,
      },
    });

    // Send notification
    await req.server.queues.notification.add('send', {
      userId: followingId,
      type: 'new_follower',
      data: {
        followerId,
      },
    });

    return reply.send({ message: 'Successfully followed user' });
  }

  async unfollowUser(req: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) {
    const followerId = req.user!.id;
    const { userId: followingId } = req.params;

    await req.server.prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return reply.send({ message: 'Successfully unfollowed user' });
  }

  async getFollowers(
    req: FastifyRequest<{
      Params: { userId: string };
      Querystring: z.infer<typeof paginationSchema>;
    }>,
    reply: FastifyReply
  ) {
    const { userId } = req.params;
    const { page, limit } = req.query;

    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      req.server.prisma.follow.findMany({
        where: { followingId: userId },
        skip,
        take: limit,
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              verifiedStreamer: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      req.server.prisma.follow.count({
        where: { followingId: userId },
      }),
    ]);

    return reply.send({
      followers: followers.map((f) => f.follower),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }

  async getFollowing(
    req: FastifyRequest<{
      Params: { userId: string };
      Querystring: z.infer<typeof paginationSchema>;
    }>,
    reply: FastifyReply
  ) {
    const { userId } = req.params;
    const { page, limit } = req.query;

    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      req.server.prisma.follow.findMany({
        where: { followerId: userId },
        skip,
        take: limit,
        include: {
          following: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              verifiedStreamer: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      req.server.prisma.follow.count({
        where: { followerId: userId },
      }),
    ]);

    return reply.send({
      following: following.map((f) => f.following),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }

  async blockUser(req: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) {
    const blockerId = req.user!.id;
    const { userId: blockedId } = req.params;

    if (blockerId === blockedId) {
      throw new AppError(400, 'Cannot block yourself', 'INVALID_OPERATION');
    }

    // Check if already blocked
    const existing = await req.server.prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    if (existing) {
      throw new AppError(409, 'User already blocked', 'ALREADY_BLOCKED');
    }

    await req.server.prisma.block.create({
      data: {
        blockerId,
        blockedId,
      },
    });

    // Remove any existing follows
    await req.server.prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: blockerId, followingId: blockedId },
          { followerId: blockedId, followingId: blockerId },
        ],
      },
    });

    return reply.send({ message: 'User blocked successfully' });
  }

  async unblockUser(req: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) {
    const blockerId = req.user!.id;
    const { userId: blockedId } = req.params;

    await req.server.prisma.block.delete({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    return reply.send({ message: 'User unblocked successfully' });
  }
}

export async function userModule(fastify: FastifyInstance) {
  const controller = new UserController();

  // Public routes
  fastify.get('/:username', {
    handler: controller.getProfile.bind(controller),
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

    protectedFastify.get('/me', {
      handler: controller.getCurrentUser.bind(controller),
    });

    protectedFastify.patch('/me/profile', {
      schema: { body: UpdateProfileSchema },
      handler: controller.updateProfile.bind(controller),
    });

    protectedFastify.patch('/me/settings', {
      schema: { body: UpdateSettingsSchema },
      handler: controller.updateSettings.bind(controller),
    });

    protectedFastify.post('/:userId/follow', {
      handler: controller.followUser.bind(controller),
    });

    protectedFastify.delete('/:userId/follow', {
      handler: controller.unfollowUser.bind(controller),
    });

    protectedFastify.get('/:userId/followers', {
      schema: { querystring: paginationSchema },
      handler: controller.getFollowers.bind(controller),
    });

    protectedFastify.get('/:userId/following', {
      schema: { querystring: paginationSchema },
      handler: controller.getFollowing.bind(controller),
    });

    protectedFastify.post('/:userId/block', {
      handler: controller.blockUser.bind(controller),
    });

    protectedFastify.delete('/:userId/block', {
      handler: controller.unblockUser.bind(controller),
    });
  });
}
