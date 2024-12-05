const initializeModels = require('../models');

module.exports = async function (context, req) {
  context.log('Processing check-registration request.');

  const email = req.query.email;
  if (!email) {
    context.log.warn('Missing email in check-registration request.');
    context.res = {
      status: 400,
      body: { error: 'Email is required' },
    };
    return;
  }

  try {
    const { User } = await initializeModels();
    const user = await User.findOne({ where: { email } });

    if (!user) {
      context.res = {
        status: 200,
        body: { registered: false },
      };
    } else {
      context.res = {
        status: 200,
        body: { registered: true },
      };
    }
  } catch (error) {
    context.log.error('Error checking registration:', error);
    context.res = {
      status: 500,
      body: { error: error.message },
    };
  }
};
