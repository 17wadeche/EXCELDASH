const Joi = require('joi');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async function (context, req) {
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
    let customers = await stripe.customers.list({ email });
    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
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
      success_url: process.env.SUCCESS_URL,
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
