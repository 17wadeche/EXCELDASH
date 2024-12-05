// verify-subscription/index.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async function (context, req) {
  const sessionId = req.query.session_id;
  if (!sessionId) {
    context.res = {
      status: 400,
      body: { error: 'Session ID is required' },
    };
    return;
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid' && session.subscription) {
      context.res = {
        status: 200,
        body: { subscribed: true },
      };
    } else {
      context.res = {
        status: 200,
        body: { subscribed: false },
      };
    }
  } catch (error) {
    context.log.error('Error verifying subscription:', error);
    context.res = {
      status: 500,
      body: { error: error.message },
    };
  }
};
