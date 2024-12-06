// webhook/index.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const initializeModels = require('../models'); // Assumes Sequelize or similar ORM

module.exports = async function (context, req) {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    context.log.error(`Webhook signature verification failed: ${err.message}`);
    context.res = {
      status: 400,
      body: `Webhook Error: ${err.message}`,
    };
    return;
  }
  context.log('Stripe event type:', event.type);
  context.log('Stripe event data:', JSON.stringify(event.data.object));
  const { User, Subscription, sequelize } = await initializeModels();
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    context.log('Processing checkout.session.completed for session:', session.id);
    const customerEmail = session.customer_details.email;
    const stripeCustomerId = session.customer;
    const transaction = await sequelize.transaction();
    try {
      let user = await User.findOne({ where: { email: customerEmail }, transaction });
      if (!user) {
        context.log(`User with email ${customerEmail} not found. Creating new user.`);
        user = await User.create({ email: customerEmail, stripeCustomerId }, { transaction });
        context.log(`Created new user with ID: ${user.id}`);
      } else {
        context.log(`Found existing user with ID: ${user.id}`);
        if (!user.stripeCustomerId) {
          context.log(`Updating user ${user.id} with Stripe Customer ID.`);
          user.stripeCustomerId = stripeCustomerId;
          await user.save({ transaction });
        }
      }
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      context.log(`Retrieved subscription from Stripe: ${subscription.id}`);
      const subscriptionPlan = subscription.items.data[0]?.price?.nickname || 'Unknown Plan';
      const paidAmount = subscription.items.data[0]?.price?.unit_amount || 0; // in cents
      const currency = subscription.items.data[0]?.price?.currency || 'usd';
      const subscriptionData = {
        subscription_id: subscription.id,
        userId: user.id,
        status: subscription.status,
        subscription_plan: subscriptionPlan,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        email: customerEmail,
        paid_amount: paidAmount,
        currency: currency,
      };
      context.log(`Upserting subscription data: ${JSON.stringify(subscriptionData)}`);
      await Subscription.upsert(subscriptionData, { transaction });
      await transaction.commit();
      context.log(`Subscription ${subscription.subscription_id} upserted for user ${customerEmail}.`);
      context.res = {
        status: 200,
        body: 'Subscription updated successfully',
      };
    } catch (error) {
      await transaction.rollback();
      context.log.error('Error updating subscription in database:', error);
      context.res = {
        status: 500,
        body: 'Webhook received but error occurred internally',
      };
    }
  } else if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;
    const stripeCustomerId = invoice.customer;
    context.log('Processing invoice.payment_succeeded for subscription:', subscriptionId);
    const transaction = await sequelize.transaction();
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      context.log(`Retrieved subscription from Stripe: ${subscription.subscription_id}`);
      const user = await User.findOne({ where: { stripeCustomerId }, transaction });
      if (!user) {
        context.log.error(`No user found for Stripe Customer ID: ${stripeCustomerId}`);
        context.res = { status: 200, body: 'User not found, but event handled' };
        await transaction.commit(); // Commit to acknowledge event
        return;
      }
      context.log(`Found user with ID: ${user.id} for Stripe Customer ID: ${stripeCustomerId}`);
      const subscriptionPlan = subscription.items.data[0]?.price?.nickname || 'Unknown Plan';
      const paidAmount = invoice.amount_paid || 0; // in cents
      const currency = invoice.currency || 'usd';
      const subscriptionData = {
        subscription_id: subscription.id,
        userId: user.id,
        status: subscription.status,
        subscription_plan: subscriptionPlan,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        paid_amount: paidAmount,
        currency: currency,
      };
      context.log(`Upserting subscription data: ${JSON.stringify(subscriptionData)}`);
      await Subscription.upsert(subscriptionData, { transaction });
      await transaction.commit();
      context.log(`Subscription ${subscription.subscription_id} updated on invoice payment succeeded for user ${user.email}.`);
      context.res = {
        status: 200,
        body: 'Subscription updated on invoice payment succeeded',
      };
    } catch (error) {
      await transaction.rollback();
      context.log.error('Error updating subscription on invoice.payment_succeeded:', error);
      context.res = {
        status: 500,
        body: 'Webhook received but error occurred internally',
      };
    }
  } else {
    context.log(`Unhandled event type ${event.type}`);
    context.res = {
      status: 200,
      body: `Unhandled event type ${event.type}`,
    };
  }
};
