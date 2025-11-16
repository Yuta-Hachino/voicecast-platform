import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import Stripe from 'stripe';
import { config } from '../../config';
import { AppError } from '../../utils/error-handler';
import { paginationSchema } from '../../utils/validators';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2024-11-20.acacia',
});

const PurchaseCoinsSchema = z.object({
  amount: z.number().int().positive(),
  paymentMethod: z.string(),
});

const SendGiftSchema = z.object({
  streamId: z.string().cuid(),
  receiverId: z.string().cuid(),
  giftType: z.string(),
  coins: z.number().int().positive(),
  message: z.string().max(200).optional(),
  isPublic: z.boolean().default(true),
});

const CreateSubscriptionSchema = z.object({
  creatorId: z.string().cuid(),
  tier: z.enum(['BASIC', 'PREMIUM', 'VIP']),
  interval: z.enum(['monthly', 'yearly']).default('monthly'),
});

const RequestPayoutSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(['stripe', 'paypal', 'bank']),
});

export class PaymentController {
  async purchaseCoins(
    req: FastifyRequest<{ Body: z.infer<typeof PurchaseCoinsSchema> }>,
    reply: FastifyReply
  ) {
    const userId = req.user!.id;
    const { amount, paymentMethod } = req.body;

    // Get user wallet
    const wallet = await req.server.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new AppError(404, 'Wallet not found', 'WALLET_NOT_FOUND');
    }

    // Calculate price (1 coin = $0.01)
    const price = amount * 0.01;

    try {
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(price * 100), // Convert to cents
        currency: 'usd',
        payment_method: paymentMethod,
        customer: wallet.stripeCustomerId || undefined,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
        metadata: {
          userId,
          type: 'coin_purchase',
          coins: amount.toString(),
        },
      });

      // Create transaction record
      const transaction = await req.server.prisma.transaction.create({
        data: {
          userId,
          walletId: wallet.id,
          type: 'COIN_PURCHASE',
          status: 'COMPLETED',
          amount: price,
          currency: 'USD',
          coins: amount,
          paymentMethod: 'stripe',
          stripePaymentId: paymentIntent.id,
          completedAt: new Date(),
        },
      });

      // Update wallet balance
      await req.server.prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          coins: {
            increment: amount,
          },
        },
      });

      // Track analytics
      await req.server.queues.analytics.add('track', {
        event: 'coins.purchased',
        userId,
        properties: {
          amount,
          price,
          transactionId: transaction.id,
        },
      });

      return reply.send({
        transaction,
        newBalance: wallet.coins + amount,
      });
    } catch (error: any) {
      throw new AppError(400, error.message, 'PAYMENT_FAILED');
    }
  }

  async sendGift(
    req: FastifyRequest<{ Body: z.infer<typeof SendGiftSchema> }>,
    reply: FastifyReply
  ) {
    const senderId = req.user!.id;
    const { streamId, receiverId, giftType, coins, message, isPublic } = req.body;

    if (senderId === receiverId) {
      throw new AppError(400, 'Cannot send gift to yourself', 'INVALID_OPERATION');
    }

    // Get sender wallet
    const senderWallet = await req.server.prisma.wallet.findUnique({
      where: { userId: senderId },
    });

    if (!senderWallet) {
      throw new AppError(404, 'Wallet not found', 'WALLET_NOT_FOUND');
    }

    if (senderWallet.coins < coins) {
      throw new AppError(400, 'Insufficient coins', 'INSUFFICIENT_BALANCE');
    }

    // Verify stream exists and is live
    const stream = await req.server.prisma.stream.findUnique({
      where: { id: streamId },
    });

    if (!stream) {
      throw new AppError(404, 'Stream not found', 'STREAM_NOT_FOUND');
    }

    if (!stream.allowGifts) {
      throw new AppError(403, 'Gifts are disabled for this stream', 'GIFTS_DISABLED');
    }

    // Calculate gift value (1 coin = $0.01, creator gets 70%)
    const value = (coins * 0.01 * 0.7).toFixed(2);

    // Perform transaction
    const result = await req.server.prisma.$transaction(async (tx) => {
      // Deduct coins from sender
      await tx.wallet.update({
        where: { id: senderWallet.id },
        data: {
          coins: {
            decrement: coins,
          },
        },
      });

      // Create gift record
      const gift = await tx.gift.create({
        data: {
          streamId,
          senderId,
          receiverId,
          giftType,
          giftName: giftType,
          coins,
          value: parseFloat(value),
          currency: 'USD',
          message,
          isPublic,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
      });

      // Update receiver's earnings
      const receiverWallet = await tx.wallet.findUnique({
        where: { userId: receiverId },
      });

      if (receiverWallet) {
        await tx.wallet.update({
          where: { id: receiverWallet.id },
          data: {
            pendingEarnings: {
              increment: parseFloat(value),
            },
            totalEarnings: {
              increment: parseFloat(value),
            },
          },
        });
      }

      // Update stream stats
      await tx.stream.update({
        where: { id: streamId },
        data: {
          totalGifts: {
            increment: 1,
          },
          totalRevenue: {
            increment: parseFloat(value),
          },
        },
      });

      // Create transactions
      await tx.transaction.create({
        data: {
          userId: senderId,
          walletId: senderWallet.id,
          type: 'GIFT_SENT',
          status: 'COMPLETED',
          amount: coins * 0.01,
          currency: 'USD',
          coins,
          description: `Gift sent to ${receiverId}`,
          completedAt: new Date(),
        },
      });

      if (receiverWallet) {
        await tx.transaction.create({
          data: {
            userId: receiverId,
            walletId: receiverWallet.id,
            type: 'GIFT_RECEIVED',
            status: 'COMPLETED',
            amount: parseFloat(value),
            currency: 'USD',
            description: `Gift received from ${senderId}`,
            completedAt: new Date(),
          },
        });
      }

      return gift;
    });

    // Publish gift event to chat
    await req.server.pubsub.publisher.publish(
      `stream:${streamId}:chat`,
      JSON.stringify({
        type: 'GIFT',
        gift: result,
      })
    );

    // Track analytics
    await req.server.queues.analytics.add('track', {
      event: 'gift.sent',
      userId: senderId,
      properties: {
        streamId,
        receiverId,
        giftType,
        coins,
        value,
      },
    });

    return reply.send({ gift: result });
  }

  async createSubscription(
    req: FastifyRequest<{ Body: z.infer<typeof CreateSubscriptionSchema> }>,
    reply: FastifyReply
  ) {
    const subscriberId = req.user!.id;
    const { creatorId, tier, interval } = req.body;

    if (subscriberId === creatorId) {
      throw new AppError(400, 'Cannot subscribe to yourself', 'INVALID_OPERATION');
    }

    // Check if already subscribed
    const existing = await req.server.prisma.subscription.findFirst({
      where: {
        subscriberId,
        creatorId,
        status: 'ACTIVE',
      },
    });

    if (existing) {
      throw new AppError(409, 'Already subscribed to this creator', 'ALREADY_SUBSCRIBED');
    }

    // Get or create Stripe customer
    const wallet = await req.server.prisma.wallet.findUnique({
      where: { userId: subscriberId },
    });

    if (!wallet) {
      throw new AppError(404, 'Wallet not found', 'WALLET_NOT_FOUND');
    }

    let stripeCustomerId = wallet.stripeCustomerId;

    if (!stripeCustomerId) {
      const user = await req.server.prisma.user.findUnique({
        where: { id: subscriberId },
      });

      const customer = await stripe.customers.create({
        email: user!.email,
        metadata: { userId: subscriberId },
      });

      stripeCustomerId = customer.id;

      await req.server.prisma.wallet.update({
        where: { id: wallet.id },
        data: { stripeCustomerId },
      });
    }

    // Calculate price based on tier
    const prices = {
      BASIC: { monthly: 4.99, yearly: 49.99 },
      PREMIUM: { monthly: 9.99, yearly: 99.99 },
      VIP: { monthly: 24.99, yearly: 249.99 },
    };

    const amount = prices[tier][interval];

    try {
      // Create Stripe subscription
      const stripeSubscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${tier} Subscription`,
              },
              unit_amount: Math.round(amount * 100),
              recurring: {
                interval: interval === 'monthly' ? 'month' : 'year',
              },
            },
          },
        ],
        metadata: {
          subscriberId,
          creatorId,
          tier,
        },
      });

      // Create subscription record
      const subscription = await req.server.prisma.subscription.create({
        data: {
          subscriberId,
          creatorId,
          tier,
          status: 'ACTIVE',
          amount,
          currency: 'USD',
          interval,
          stripeSubscriptionId: stripeSubscription.id,
          stripeCustomerId,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        },
      });

      // Track analytics
      await req.server.queues.analytics.add('track', {
        event: 'subscription.created',
        userId: subscriberId,
        properties: {
          creatorId,
          tier,
          interval,
          amount,
        },
      });

      return reply.code(201).send({ subscription });
    } catch (error: any) {
      throw new AppError(400, error.message, 'SUBSCRIPTION_FAILED');
    }
  }

  async cancelSubscription(
    req: FastifyRequest<{ Params: { subscriptionId: string } }>,
    reply: FastifyReply
  ) {
    const userId = req.user!.id;
    const { subscriptionId } = req.params;

    const subscription = await req.server.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new AppError(404, 'Subscription not found', 'SUBSCRIPTION_NOT_FOUND');
    }

    if (subscription.subscriberId !== userId) {
      throw new AppError(403, 'You do not own this subscription', 'FORBIDDEN');
    }

    // Cancel on Stripe
    if (subscription.stripeSubscriptionId) {
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    }

    // Update subscription
    await req.server.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
      },
    });

    return reply.send({ message: 'Subscription canceled successfully' });
  }

  async requestPayout(
    req: FastifyRequest<{ Body: z.infer<typeof RequestPayoutSchema> }>,
    reply: FastifyReply
  ) {
    const userId = req.user!.id;
    const { amount, method } = req.body;

    const wallet = await req.server.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new AppError(404, 'Wallet not found', 'WALLET_NOT_FOUND');
    }

    if (wallet.earnings < amount) {
      throw new AppError(400, 'Insufficient balance', 'INSUFFICIENT_BALANCE');
    }

    if (amount < wallet.minPayout) {
      throw new AppError(
        400,
        `Minimum payout is ${wallet.minPayout} ${wallet.currency}`,
        'BELOW_MINIMUM'
      );
    }

    // Create payout request
    const payout = await req.server.prisma.payout.create({
      data: {
        userId,
        walletId: wallet.id,
        amount,
        currency: wallet.currency,
        status: 'PENDING',
        method,
        destination: {},
      },
    });

    // Queue for processing
    await req.server.queues.payout.add('process', {
      payoutId: payout.id,
      userId,
      amount,
      method,
    });

    return reply.code(201).send({ payout });
  }

  async getTransactions(
    req: FastifyRequest<{
      Querystring: z.infer<typeof paginationSchema>;
    }>,
    reply: FastifyReply
  ) {
    const userId = req.user!.id;
    const { page, limit } = req.query;

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      req.server.prisma.transaction.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      req.server.prisma.transaction.count({
        where: { userId },
      }),
    ]);

    return reply.send({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }

  async getWallet(req: FastifyRequest, reply: FastifyReply) {
    const userId = req.user!.id;

    const wallet = await req.server.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new AppError(404, 'Wallet not found', 'WALLET_NOT_FOUND');
    }

    return reply.send({ wallet });
  }
}

export async function paymentModule(fastify: FastifyInstance) {
  const controller = new PaymentController();

  // All payment routes are protected
  fastify.register(async function (protectedFastify) {
    protectedFastify.addHook('onRequest', async (req, reply) => {
      try {
        await req.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    });

    protectedFastify.get('/wallet', {
      handler: controller.getWallet.bind(controller),
    });

    protectedFastify.get('/transactions', {
      schema: { querystring: paginationSchema },
      handler: controller.getTransactions.bind(controller),
    });

    protectedFastify.post('/coins/purchase', {
      schema: { body: PurchaseCoinsSchema },
      handler: controller.purchaseCoins.bind(controller),
    });

    protectedFastify.post('/gifts/send', {
      schema: { body: SendGiftSchema },
      handler: controller.sendGift.bind(controller),
    });

    protectedFastify.post('/subscriptions', {
      schema: { body: CreateSubscriptionSchema },
      handler: controller.createSubscription.bind(controller),
    });

    protectedFastify.delete('/subscriptions/:subscriptionId', {
      handler: controller.cancelSubscription.bind(controller),
    });

    protectedFastify.post('/payouts', {
      schema: { body: RequestPayoutSchema },
      handler: controller.requestPayout.bind(controller),
    });
  });
}
