const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const initializeModels = require('../models'); // Adjust path as necessary

module.exports = async function (context, req) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    context.log.warn('Webhook signature verification failed:', err.message);
    context.res = {
      status: 400,
      body: `Webhook Error: ${err.message}`,
    };
    return;
  }

  // Handle the event
  try {
    await handleEvent(event, context);
    context.res = {
      status: 200,
      body: { received: true },
    };
  } catch (error) {
    context.log.error('Error handling webhook event:', error);
    context.res = {
      status: 500,
      body: 'Internal Server Error',
    };
  }
};

// Implement your event handler function
async function handleEvent(event, context) {
  const { License } = await initializeModels();

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object, License, context);
      break;
    // Add other cases as needed
    default:
      context.log.info(`Unhandled event type ${event.type}`);
  }
}
