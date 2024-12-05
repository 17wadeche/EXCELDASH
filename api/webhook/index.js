// webhook index.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const initializeModels = require('../models');
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
  context.log('Stripe event data:', event.data.object);
  const { User, Subscription } = await initializeModels();
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    context.log('Session subscription:', session.subscription);
    const customerEmail = session.customer_details.email;
    const stripeCustomerId = session.customer;
    try {
      let user = await User.findOne({ where: { email: customerEmail } });
      if (!user) {
        user = await User.create({ email: customerEmail, stripeCustomerId });
      } else {
        if (!user.stripeCustomerId) {
          user.stripeCustomerId = stripeCustomerId;
          await user.save();
        }
      }
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      await Subscription.upsert({
        id: subscription.id,
        userId: user.id,
        status: subscription.status,
        plan: subscription.items.data[0].price.nickname,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      });
      context.log('Subscription updated in database for user:', customerEmail);
      context.res = {
        status: 200,
        body: 'Subscription updated successfully',
      };
    } catch (error) {
      context.log.error('Error updating subscription in database:', error);
      context.res = {
        status: 200,
        body: 'Webhook received but error occurred internally',
      };
    }
  } else if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;
    const stripeCustomerId = invoice.customer;
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const user = await User.findOne({ where: { stripeCustomerId } });
      if (!user) {
        context.log.error('No user found for this Stripe customer ID:', stripeCustomerId);
        context.res = { status: 200, body: 'User not found, but event handled' };
        return;
      }
      await Subscription.upsert({
        id: subscription.id,
        userId: user.id,
        status: subscription.status,
        plan: subscription.items.data[0].price.nickname,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      });
      context.log('Subscription updated on invoice payment succeeded for user:', user.email);
      context.res = {
        status: 200,
        body: 'Subscription updated on invoice payment succeeded',
      };
    } catch (error) {
      context.log.error('Error updating subscription on invoice.payment_succeeded:', error);
      context.res = {
        status: 200,
        body: 'Webhook received but error occurred internally',
      };
    }
  } else {
    context.res = {
      status: 200,
      body: `Unhandled event type ${event.type}`,
    };
  }
};
