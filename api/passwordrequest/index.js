// password-reset/request/index.js

const initializeModels = require('../models');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const { sendPasswordResetEmail } = require('../email');

module.exports = async function (context, req) {
  context.log('=== [passwordrequest/index.js] START ===');
  const schema = Joi.object({
    email: Joi.string().email().required(),
  });
  const { error, value } = schema.validate(req.body);
  if (error) {
    context.log.error('[passwordrequest] Validation error:', error.details[0].message);
    context.res = {
      status: 400,
      body: { error: error.details[0].message },
    };
    context.log('=== [passwordrequest/index.js] END (validation fail) ===');
    return;
  }
  const { email } = value;
  try {
    const { User, PasswordResetToken } = await initializeModels();
    context.log('[passwordrequest] Models loaded.');
    const user = await User.findOne({ where: { userEmail: email } });
    if (!user) {
      context.log.error('[passwordrequest] User not found:', email);
      context.res = {
        status: 200,
        body: { message: 'If that email address is in our system, we have sent a password reset link to it.' },
      };
      context.log('=== [passwordrequest/index.js] END (user not found) ===');
      return;
    }
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await PasswordResetToken.create({
      userEmail: email,
      token,
      expiresAt,
    });
    const resetLink = `${process.env.FRONTEND_BASE_URL}/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, resetLink);
    context.log('[passwordrequest] Password reset email sent to:', email);
    context.res = {
      status: 200,
      body: { message: 'If that email address is in our system, we have sent a password reset link to it.' },
    };
    context.log('=== [passwordrequest/index.js] END (success) ===');
  } catch (err) {
    context.log.error('[passwordrequest] Error:', err);
    context.res = {
      status: 500,
      body: { error: 'Internal Server Error' },
    };
    context.log('=== [passwordrequest/index.js] END (error) ===');
  }
};
