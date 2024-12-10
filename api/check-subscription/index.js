// check-subscription/index.js

const initializeModels = require('../models');

module.exports = async function (context, req) {
  context.log('Processing check-subscription request.');
  const email = req.query.email;
  if (!email) {
    context.log.warn('Missing email in check-subscription request.');
    context.res = {
      status: 400,
      body: { error: 'Email is required' },
    };
    return;
  }
  try {
    const { User, Subscription } = await initializeModels();
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Subscription,
          required: false,
        },
      ],
    });
    if (!user || !user.Subscription) {
      context.log.info(`User with email ${email} not found or has no subscription.`);
      context.res = {
        status: 200,
        body: { subscribed: false },
      };
      return;
    }
    const isActive = user.Subscription.status === 'active';
    context.log.info(`User ${email} subscription is ${isActive ? 'active' : 'inactive'}.`);
    context.res = {
      status: 200,
      body: {
        subscribed: isActive,
        plan: isActive ? user.Subscription.subscription_plan : null,
      },
    };
  } catch (error) {
    context.log.error('Error checking subscription:', error);
    context.res = {
      status: 500,
      body: { error: error.message },
    };
  }
};
