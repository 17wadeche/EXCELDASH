const Joi = require('joi');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const initializeModels = require('../models');

module.exports = async function (context, req) {
  // Validate input
  const schema = Joi.object({
    email: Joi.string().email().required(),
    plan: Joi.string().valid('monthly', 'yearly').required(),
  });
  const { error, value } = schema.validate(req.body);

  if (error) {
    context.res = {
      status: 400,
      body: { error: error.details[0].message },
    };
    return;
  }

  const { email, plan } = value;
  let priceId;

  if (plan === 'monthly') {
    priceId = process.env.PRICE_ID_MONTHLY;
  } else if (plan === 'yearly') {
    priceId = process.env.PRICE_ID_YEARLY;
  }

  try {
    // Create or retrieve the customer in Stripe
    let customer = await stripe.customers.list({ email });
    if (customer.data.length > 0) {
      customer = customer.data[0];
    } else {
      customer = await stripe.customers.create({ email });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer: customer.id,
      metadata: {
        email,
      },
      success_url: process.env.SUCCESS_URL + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: process.env.CANCEL_URL,
    });

    context.res = {
      status: 200,
      body: { url: session.url },
    };
  } catch (error) {
    context.log.error('Error creating checkout session:', error);
    context.res = {
      status: 500,
      body: { error: error.message },
    };
  }
};
