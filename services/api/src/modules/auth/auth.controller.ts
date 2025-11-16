import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import argon2 from 'argon2';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { AuthService } from './auth.service';
import { EmailService } from '../../services/email.service';
import { usernameSchema, passwordSchema, emailSchema, displayNameSchema } from '../../utils/validators';

// Validation schemas
const RegisterSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
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

  async register(
    req: FastifyRequest<{ Body: z.infer<typeof RegisterSchema> }>,
    reply: FastifyReply
  ) {
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

  async login(
    req: FastifyRequest<{ Body: z.infer<typeof LoginSchema> }>,
    reply: FastifyReply
  ) {
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

    // Check if account is locked
    const isLocked = await this.authService.isAccountLocked(user.id);
    if (isLocked) {
      return reply.code(423).send({
        error: 'Account temporarily locked',
        message: 'Too many failed login attempts. Please try again later.',
      });
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
      await req.server.redis.setex(`blacklist:${refreshToken}`, 30 * 24 * 60 * 60, '1');
    }

    // Clear cookie
    reply.clearCookie('refreshToken');

    return reply.send({ message: 'Logged out successfully' });
  }

  async setup2FA(req: FastifyRequest, reply: FastifyReply) {
    const user = req.user!;

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `VoiceCast (${user.username})`,
      issuer: 'VoiceCast',
    });

    // Store secret temporarily
    await req.server.redis.setex(
      `2fa_setup:${user.id}`,
      600, // 10 minutes
      secret.base32!
    );

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    return reply.send({
      secret: secret.base32,
      qrCode,
      backupCodes: await this.authService.generateBackupCodes(user.id),
    });
  }

  async verify2FA(req: FastifyRequest<{ Body: { code: string } }>, reply: FastifyReply) {
    const user = req.user!;
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

  async disable2FA(req: FastifyRequest<{ Body: { password: string } }>, reply: FastifyReply) {
    const user = req.user!;
    const { password } = req.body;

    // Get full user data
    const fullUser = await req.server.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!fullUser) {
      return reply.code(404).send({ error: 'User not found' });
    }

    // Verify password
    const isValidPassword = await argon2.verify(fullUser.passwordHash, password);
    if (!isValidPassword) {
      return reply.code(401).send({ error: 'Invalid password' });
    }

    // Disable 2FA
    await req.server.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: null },
    });

    // Remove backup codes
    await req.server.redis.del(`backup_codes:${user.id}`);

    return reply.send({ message: '2FA disabled successfully' });
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
  fastify.register(async function (protectedFastify) {
    protectedFastify.addHook('onRequest', async (req, reply) => {
      try {
        await req.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    });

    protectedFastify.post('/2fa/setup', {
      handler: controller.setup2FA.bind(controller),
    });

    protectedFastify.post('/2fa/verify', {
      handler: controller.verify2FA.bind(controller),
    });

    protectedFastify.post('/2fa/disable', {
      handler: controller.disable2FA.bind(controller),
    });
  });
}
