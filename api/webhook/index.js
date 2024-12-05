//webhook index
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const initializeModels = require('../models');
module.exports = async function (context, req) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    context.log.error(`Webhook signature verification failed: ${err.message}`);
    context.res = {
      status: 400,
      body: `Webhook Error: ${err.message}`,
    };
    return;
  }

  const { User, Subscription } = await initializeModels();

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Extract customer email
    const customerEmail = session.customer_details.email;

    try {
      // Find or create the user in the database
      let user = await User.findOne({ where: { email: customerEmail } });
      if (!user) {
        user = await User.create({ email: customerEmail });
      }

      // Create or update the subscription in the database
      const subscription = await stripe.subscriptions.retrieve(session.subscription);

      await Subscription.upsert({
        id: subscription.id,
        userId: user.id,
        status: subscription.status,
        plan: subscription.items.data[0].plan.nickname,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      });

      context.log('Subscription updated in database for user:', customerEmail);
      context.res = {
        status: 200,
        body: 'Subscription updated successfully',
      };
    } catch (error) {
      context.log.error('Error updating subscription in database:', error);
      // Respond with 200 to prevent Stripe from retrying the webhook
      context.res = {
        status: 200,
        body: 'Webhook received but error occurred internally',
      };
    }
  } else {
    // Handle other event types as needed
    context.res = {
      status: 200,
      body: `Unhandled event type ${event.type}`,
    };
  }
};
