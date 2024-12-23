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
    context.log(`check-subscription: Looking for userEmail = "${email}"`);
    const user = await User.findOne({
      where: { userEmail: email },
      include: [
        {
          model: Subscription,
          required: false,
        },
      ],
    });
    if (!user) {
      context.log(`No user row found for userEmail="${email}"`);
      context.res = {
        status: 200,
        body: { subscribed: false },
      };
      return;
    }
    context.log(`Found user: ${JSON.stringify(user, null, 2)}`);
    if (!user.Subscriptions || user.Subscriptions.length === 0) {
      context.log.info(`User with userEmail "${email}" has no subscription rows.`);
      context.res = {
        status: 200,
        body: { subscribed: false },
      };
      return;
    }
    const activeSubscription = user.Subscriptions.find(
      (sub) => sub.status === 'active'
    );
    if (!activeSubscription) {
      context.log.info(`User "${email}" has subscriptions, but none are active.`);
      context.res = {
        status: 200,
        body: { subscribed: false },
      };
      return;
    }
    context.log.info(`User "${email}" has an active subscription: ${activeSubscription.subscription_id}`);
    context.res = {
      status: 200,
      body: {
        subscribed: true,
        plan: activeSubscription.subscription_plan,
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
