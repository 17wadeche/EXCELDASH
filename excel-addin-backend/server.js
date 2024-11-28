// server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Stripe = require('stripe');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const morgan = require('morgan');
const winston = require('winston');

const app = express();
const EventEmitter = require('events');
EventEmitter.defaultMaxListeners = 100; 
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
const allowedOrigins = [
  'https://exceladdinstoragecw.z13.web.core.windows.net', // Frontend
  'http://localhost:3000', // Local development
];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

app.use(cors(corsOptions)); // Enable CORS for specified origins
app.options('*', cors(corsOptions)); 
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes.',
});
app.use(limiter);
app.use(bodyParser.json()); 
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const initialize = async () => {
  try {
    const { sequelize, User, License, Subscription } = await require('./models')(); 
    app.post('/api/create-checkout-session', async (req, res) => {
      const schema = Joi.object({
        licenseKey: Joi.string().required(),
        plan: Joi.string().valid('monthly', 'yearly').required(),
      });
      const { error, value } = schema.validate(req.body);
      if (error) {
        logger.warn('Validation error:', error.details[0].message);
        return res.status(400).json({ error: error.details[0].message });
      }
      const { licenseKey, plan } = value;
      let priceId;
      if (plan === 'monthly') {
        priceId = process.env.PRICE_ID_MONTHLY;
      } else if (plan === 'yearly') {
        priceId = process.env.PRICE_ID_YEARLY;
      }
      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'subscription',
          line_items: [{
            price: priceId,
            quantity: 1,
          }],
          metadata: {
            licenseKey,
          },
          success_url: process.env.SUCCESS_URL,
          cancel_url: process.env.CANCEL_URL,
        });
        res.json({ url: session.url });
      } catch (error) {
        logger.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
    app.post('/api/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
      const sig = req.headers['stripe-signature'];
      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      } catch (err) {
        logger.warn('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
      try {
        switch (event.type) {
          case 'checkout.session.completed':
            await handleCheckoutSessionCompleted(event.data.object);
            break;
          case 'invoice.payment_succeeded':
            await handleInvoicePaymentSucceeded(event.data.object);
            break;
          case 'invoice.payment_failed':
            await handleInvoicePaymentFailed(event.data.object);
            break;
          case 'customer.subscription.deleted':
            await handleSubscriptionDeleted(event.data.object);
            break;
          default:
            logger.info(`Unhandled event type ${event.type}`);
        }
        res.json({ received: true });
      } catch (err) {
        logger.error('Error handling webhook event:', err);
        res.status(500).send('Internal Server Error');
      }
    });
    app.get('/api/check-subscription', async (req, res) => {
      const { licenseKey } = req.query;
      if (!licenseKey) {
        logger.warn('Missing licenseKey in check-subscription request.');
        return res.status(400).json({ error: 'licenseKey is required' });
      }
      try {
        const license = await License.findOne({ where: { licenseKey } });
        if (!license) {
          return res.json({ subscribed: false });
        }
        const isActive = license.subscriptionStatus === 'active';
        res.json({
          subscribed: isActive,
          plan: isActive ? license.plan : null,
        });
      } catch (error) {
        logger.error('Error checking subscription:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
    const handleCheckoutSessionCompleted = async (session) => {
      const licenseKey = session.metadata.licenseKey;
      const email = session.customer_details.email;
      const subscriptionId = session.subscription;
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0].price.id;
        let plan;
        if (priceId === process.env.PRICE_ID_MONTHLY) {
          plan = 'monthly';
        } else if (priceId === process.env.PRICE_ID_YEARLY) {
          plan = 'yearly';
        } else {
          logger.warn('Unknown price ID:', priceId);
          return;
        }
        await License.upsert({
          licenseKey,
          email,
          subscriptionId,
          subscriptionStatus: 'active',
          plan,
        });
        logger.info(`Subscription completed for licenseKey: ${licenseKey}, plan: ${plan}`);
      } catch (error) {
        logger.error('Error in handleCheckoutSessionCompleted:', error);
      }
    };
    const handleInvoicePaymentSucceeded = async (invoice) => {
      const subscriptionId = invoice.subscription;
      try {
        const license = await License.findOne({ where: { subscriptionId } });
        if (license) {
          license.subscriptionStatus = 'active';
          await license.save();
          logger.info(`Payment succeeded for subscriptionId: ${subscriptionId}`);
        } else {
          logger.warn(`License not found for subscriptionId: ${subscriptionId}`);
        }
      } catch (error) {
        logger.error('Error in handleInvoicePaymentSucceeded:', error);
      }
    };
    const handleInvoicePaymentFailed = async (invoice) => {
      const subscriptionId = invoice.subscription;
      try {
        const license = await License.findOne({ where: { subscriptionId } });
        if (license) {
          license.subscriptionStatus = 'past_due';
          await license.save();
          logger.info(`Payment failed for subscriptionId: ${subscriptionId}`);
        } else {
          logger.warn(`License not found for subscriptionId: ${subscriptionId}`);
        }
      } catch (error) {
        logger.error('Error in handleInvoicePaymentFailed:', error);
      }
    };
    const handleSubscriptionDeleted = async (subscription) => {
      const subscriptionId = subscription.id;
      try {
        const license = await License.findOne({ where: { subscriptionId } });
        if (license) {
          license.subscriptionStatus = 'canceled';
          await license.save();
          logger.info(`Subscription deleted for subscriptionId: ${subscriptionId}`);
        } else {
          logger.warn(`License not found for subscriptionId: ${subscriptionId}`);
        }
      } catch (error) {
        logger.error('Error in handleSubscriptionDeleted:', error);
      }
    };
    app.use((err, req, res, next) => {
      logger.error('Unhandled Error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    });
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });

  } catch (error) {
    console.error('Error initializing application:', error);
    process.exit(1); 
  }
};
initialize();
