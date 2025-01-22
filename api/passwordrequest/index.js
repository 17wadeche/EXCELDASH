// password-reset/request/index.js

const initializeModels = require('../models');
const Joi = require('joi');
const { sendPasswordResetEmail } = require('../email');

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
    const token = generateCode();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await PasswordResetToken.create({
      userEmail: email,
      token,
      expiresAt,
    });
    const messageBody = `
      <p>You requested a password reset. Here is your password reset code:</p>
      <h2>${token}</h2>
      <p>This code will expire in 60 minutes. If you did not request this, please ignore this email.</p>
    `;
    await sendPasswordResetEmail(email, messageBody);
    context.log('[passwordrequest] Password reset code sent to:', email);
    context.res = {
      status: 200,
      body: { message: 'If that email is in our system, a password reset code has been sent.' },
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
