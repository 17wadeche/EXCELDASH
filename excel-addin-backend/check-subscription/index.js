const initializeModels = require('../models');

module.exports = async function (context, req) {
  context.log('Processing check-subscription request.');

  const licenseKey = req.query.licenseKey;
  if (!licenseKey) {
    context.log.warn('Missing licenseKey in check-subscription request.');
    context.res = {
      status: 400,
      body: { error: 'licenseKey is required' },
    };
    return;
  }

  try {
    const { License } = await initializeModels();
    const license = await License.findOne({ where: { licenseKey } });
    if (!license) {
      context.res = {
        status: 200,
        body: { subscribed: false },
      };
      return;
    }

    const isActive = license.subscriptionStatus === 'active';
    context.res = {
      status: 200,
      body: {
        subscribed: isActive,
        plan: isActive ? license.plan : null,
      },
    };
  } catch (error) {
    context.log.error('Error checking subscription:', error);
    context.res = {
      status: 500,
      body: { error: 'Internal Server Error' },
    };
  }
};
