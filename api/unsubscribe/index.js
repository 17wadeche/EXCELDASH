const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const initializeModels = require('../models');

module.exports = async function (context, req) {
  const { email } = req.body;

  if (!email) {
    context.res = {
      status: 400,
      body: { error: 'Email is required.' }
    };
    return;
  }

  const { User, Subscription, sequelize } = await initializeModels();
  const transaction = await sequelize.transaction();

  try {
    // Fetch the user using the correct field name
    const user = await User.findOne({ where: { UserEmail: email }, transaction });
    if (!user) {
      await transaction.rollback();
      context.res = {
        status: 404,
        body: { error: 'User not found.' }
      };
      return;
    }

    // Use the correct property to access the email
    const subscription = await Subscription.findOne({
      where: { userEmail: user.UserEmail, status: 'active' },
      transaction
    });

    if (!subscription) {
      await transaction.rollback();
      context.res = {
        status: 404,
        body: { error: 'No active subscription found for this user.' }
      };
      return;
    }

    await stripe.subscriptions.update(subscription.subscription_id, {
      cancel_at_period_end: false
    });

    subscription.status = 'canceled';
    await subscription.save({ transaction });
    await transaction.commit();

    context.res = {
      status: 200,
      body: { message: 'Subscription canceled successfully.' }
    };
  } catch (error) {
    await transaction.rollback();
    context.log.error('Error unsubscribing:', error);
    context.res = {
      status: 500,
      body: { error: 'Failed to unsubscribe. Please try again later.' }
    };
  }
};
