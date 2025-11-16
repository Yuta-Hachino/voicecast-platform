import { PrismaClient, User } from '@prisma/client';
import { Redis } from 'ioredis';
import { randomBytes } from 'crypto';

export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private redis: Redis
  ) {}

  async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    // In a real implementation, you would use the Fastify JWT instance
    // For now, we'll return placeholder tokens
    const accessToken = Buffer.from(JSON.stringify(payload)).toString('base64');
    const refreshToken = randomBytes(32).toString('hex');

    // Store refresh token in Redis with 30 day expiry
    await this.redis.setex(
      `refresh_token:${user.id}:${refreshToken}`,
      30 * 24 * 60 * 60,
      JSON.stringify(payload)
    );

    return { accessToken, refreshToken };
  }

  async logFailedAttempt(userId: string, ip: string): Promise<void> {
    const key = `failed_login:${userId}`;
    const attempts = await this.redis.incr(key);

    if (attempts === 1) {
      await this.redis.expire(key, 900); // 15 minutes
    }

    if (attempts >= 5) {
      // Lock account temporarily
      await this.redis.setex(`account_locked:${userId}`, 1800, '1'); // 30 minutes

      // Log security event
      await this.prisma.activity.create({
        data: {
          userId,
          type: 'LOGIN',
          action: 'account_locked',
          metadata: {
            reason: 'too_many_failed_attempts',
            attempts,
            ip,
          },
          ipAddress: ip,
        },
      });
    }
  }

  async isAccountLocked(userId: string): Promise<boolean> {
    const locked = await this.redis.get(`account_locked:${userId}`);
    return locked === '1';
  }

  async generateBackupCodes(userId: string): Promise<string[]> {
    const codes: string[] = [];

    for (let i = 0; i < 10; i++) {
      const code = randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }

    // Store hashed codes in Redis
    await this.redis.setex(
      `backup_codes:${userId}`,
      365 * 24 * 60 * 60, // 1 year
      JSON.stringify(codes)
    );

    return codes;
  }

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const stored = await this.redis.get(`backup_codes:${userId}`);

    if (!stored) {
      return false;
    }

    const codes = JSON.parse(stored) as string[];
    const index = codes.indexOf(code);

    if (index === -1) {
      return false;
    }

    // Remove used code
    codes.splice(index, 1);

    if (codes.length > 0) {
      await this.redis.setex(
        `backup_codes:${userId}`,
        365 * 24 * 60 * 60,
        JSON.stringify(codes)
      );
    } else {
      await this.redis.del(`backup_codes:${userId}`);
    }

    return true;
  }

  async validateSession(userId: string, sessionId: string): Promise<boolean> {
    const session = await this.redis.get(`session:${userId}:${sessionId}`);
    return session !== null;
  }

  async invalidateAllSessions(userId: string): Promise<void> {
    const pattern = `session:${userId}:*`;
    const keys = await this.redis.keys(pattern);

    if (keys.length > 0) {
      await this.redis.del(...keys);
    }

    // Also invalidate all refresh tokens
    const refreshPattern = `refresh_token:${userId}:*`;
    const refreshKeys = await this.redis.keys(refreshPattern);

    if (refreshKeys.length > 0) {
      await this.redis.del(...refreshKeys);
    }
  }
}
