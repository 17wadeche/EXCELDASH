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
  context.log('Stripe event data:', event.data.object);
  const { User, Subscription } = await initializeModels(); // Initialize ORM models
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
        subscription_id: subscription.id, // Unique identifier from Stripe
        userId: user.id,                   // Foreign key to Users table
        status: subscription.status,
        subscription_plan: subscription.items.data[0].price.nickname, // Updated attribute
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        email: customerEmail,              // Ensure this matches the 'email' column
        paid_amount: subscription.plan.amount, // Adjust based on actual Stripe response
        currency: subscription.plan.currency,  // Adjust based on actual Stripe response
        createdAt: new Date(subscription.created * 1000),
        updatedAt: new Date(subscription.updated * 1000),
      });
      context.log('Subscription updated in database for user:', customerEmail);
      context.res = {
        status: 200,
        body: 'Subscription updated successfully',
      };
    } catch (error) {
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
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const user = await User.findOne({ where: { stripeCustomerId } });
      if (!user) {
        context.log.error('No user found for this Stripe customer ID:', stripeCustomerId);
        context.res = { status: 200, body: 'User not found, but event handled' };
        return;
      }
      await Subscription.upsert({
        subscription_id: subscription.id,
        userId: user.id,
        status: subscription.status,
        subscription_plan: subscription.items.data[0].price.nickname, // Updated attribute
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        paid_amount: invoice.amount_paid,   
        currency: invoice.currency,          
        updatedAt: new Date(), // Update the 'updatedAt' field
      });
      context.log('Subscription updated on invoice payment succeeded for user:', user.email);
      context.res = {
        status: 200,
        body: 'Subscription updated on invoice payment succeeded',
      };
    } catch (error) {
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
