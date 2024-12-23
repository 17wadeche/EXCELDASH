const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const initializeModels = require('../models');
const jwt = require('jsonwebtoken'); 
module.exports = async function (context, req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    context.res = {
      status: 401,
      body: { error: 'Authorization header missing.' }
    };
    return;
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    context.res = {
      status: 401,
      body: { error: 'Token missing.' }
    };
    return;
  }
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    context.res = {
      status: 403,
      body: { error: 'Invalid token.' }
    };
    return;
  }
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
    const user = await User.findOne({ where: { UserEmail: email }, transaction });
    if (!user) {
      await transaction.rollback();
      context.res = {
        status: 404,
        body: { error: 'User not found.' }
      };
      return;
    }
    if (decoded.email !== email) {
      await transaction.rollback();
      context.res = {
        status: 403,
        body: { error: 'Cannot unsubscribe another user.' }
      };
      return;
    }
    const subscription = await Subscription.findOne({
      where: { userEmail: user.email, status: 'active' },
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
