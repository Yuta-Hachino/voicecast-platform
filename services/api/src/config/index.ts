import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

export const config = {
  isProd: process.env.NODE_ENV === 'production',
  isDev: process.env.NODE_ENV === 'development',

  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',

  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/voicecast',
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // Cookie
  cookie: {
    secret: process.env.COOKIE_SECRET || 'your-super-secret-cookie-key-change-in-production',
  },

  // CORS
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3001', 'http://localhost:5173'],
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },

  // PayPal
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    secret: process.env.PAYPAL_SECRET || '',
    mode: process.env.PAYPAL_MODE || 'sandbox',
  },

  // Email (SendGrid)
  email: {
    from: process.env.EMAIL_FROM || 'noreply@voicecast.io',
    apiKey: process.env.SENDGRID_API_KEY || '',
  },

  // Storage (MinIO/S3)
  storage: {
    endpoint: process.env.S3_ENDPOINT || 'localhost',
    port: parseInt(process.env.S3_PORT || '9000', 10),
    useSSL: process.env.S3_USE_SSL === 'true',
    accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.S3_SECRET_KEY || 'minioadmin',
    bucket: process.env.S3_BUCKET || 'voicecast',
  },

  // MediaSoup
  mediasoup: {
    worker: {
      rtcMinPort: parseInt(process.env.MEDIASOUP_MIN_PORT || '10000', 10),
      rtcMaxPort: parseInt(process.env.MEDIASOUP_MAX_PORT || '10100', 10),
      logLevel: process.env.MEDIASOUP_LOG_LEVEL || 'warn',
      logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'],
    },
    router: {
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2,
        },
      ],
    },
    webRtcTransport: {
      listenIps: [
        {
          ip: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
          announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP,
        },
      ],
      maxIncomingBitrate: 1500000,
    },
  },

  // MeiliSearch
  meili: {
    host: process.env.MEILI_HOST || 'http://localhost:7700',
    apiKey: process.env.MEILI_API_KEY || '',
  },

  // CloudFlare
  cloudflare: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    apiToken: process.env.CLOUDFLARE_API_TOKEN || '',
    streamApiToken: process.env.CLOUDFLARE_STREAM_API_TOKEN || '',
  },

  // Rate Limiting
  rateLimit: {
    global: {
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      timeWindow: process.env.RATE_LIMIT_WINDOW || '1 minute',
    },
    auth: {
      max: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5', 10),
      timeWindow: process.env.RATE_LIMIT_AUTH_WINDOW || '15 minutes',
    },
  },
};
