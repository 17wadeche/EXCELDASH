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

  const { License } = await initializeModels();

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Extract license key and customer email
    const licenseKey = session.metadata.licenseKey;
    const customerEmail = session.customer_details.email;

    // Update or create the license in the database
    try {
      await License.upsert({
        licenseKey: licenseKey,
        subscriptionId: session.subscription,
        subscriptionStatus: 'active',
        plan: session.display_items ? session.display_items[0].plan.nickname : 'unknown',
        userId: null, // Update with actual user ID if available
      });

      context.log('License updated in database:', licenseKey);
      context.res = {
        status: 200,
        body: 'License updated successfully',
      };
    } catch (error) {
      context.log.error('Error updating license in database:', error);
      context.res = {
        status: 500,
        body: 'Internal Server Error',
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
