import { Queue } from 'bullmq';

export class EmailService {
  constructor(private emailQueue: Queue) {}

  async sendVerificationEmail(email: string, userId: string): Promise<void> {
    const token = this.generateVerificationToken();

    await this.emailQueue.add('verification', {
      to: email,
      subject: 'Verify Your VoiceCast Account',
      template: 'verification',
      data: {
        userId,
        token,
        verificationUrl: `${process.env.APP_URL}/verify-email?token=${token}`,
      },
    });
  }

  async sendPasswordResetEmail(email: string, userId: string): Promise<void> {
    const token = this.generateResetToken();

    await this.emailQueue.add('password-reset', {
      to: email,
      subject: 'Reset Your VoiceCast Password',
      template: 'password-reset',
      data: {
        userId,
        token,
        resetUrl: `${process.env.APP_URL}/reset-password?token=${token}`,
      },
    });
  }

  async sendWelcomeEmail(email: string, displayName: string): Promise<void> {
    await this.emailQueue.add('welcome', {
      to: email,
      subject: 'Welcome to VoiceCast!',
      template: 'welcome',
      data: {
        displayName,
      },
    });
  }

  private generateVerificationToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generateResetToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
