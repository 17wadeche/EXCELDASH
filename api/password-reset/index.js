// password-reset/confirm/index.js

const initializeModels = require('../models');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = async function (context, req) {
  context.log('=== [password-reset/index.js] START ===');

  const schema = Joi.object({
    token: Joi.string().uuid().required(),
    newPassword: Joi.string().min(6).required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    context.log.error('[password-reset/confirm] Validation error:', error.details[0].message);
    context.res = {
      status: 400,
      body: { error: error.details[0].message },
    };
    context.log('=== [password-reset/index.js] END (validation fail) ===');
    return;
  }
  const { token, newPassword } = value;
  try {
    const { User, PasswordResetToken, RefreshToken } = await initializeModels();
    context.log('[password-reset/] Models loaded.');

    const resetTokenRecord = await PasswordResetToken.findOne({ where: { token } });
    if (!resetTokenRecord) {
      context.log.error('[password-reset/] Invalid token:', token);
      context.res = {
        status: 400,
        body: { error: 'Invalid or expired token.' },
      };
      context.log('=== [password-reset/index.js] END (invalid token) ===');
      return;
    }
    if (resetTokenRecord.expiresAt < new Date()) {
      context.log.error('[password-reset/] Token expired:', token);
      await resetTokenRecord.destroy();
      context.res = {
        status: 400,
        body: { error: 'Invalid or expired token.' },
      };
      context.log('=== [password-reset/index.js] END (expired token) ===');
      return;
    }
    const userEmail = resetTokenRecord.userEmail;
    const user = await User.findOne({ where: { userEmail } });
    if (!user) {
      context.log.error('[password-reset/] User not found for token:', token);
      context.res = {
        status: 400,
        body: { error: 'Invalid token.' },
      };
      context.log('=== [password-reset/index.js] END (user not found) ===');
      return;
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.update(
      { password: hashedPassword },
      { where: { userEmail } }
    );
    await RefreshToken.destroy({ where: { userEmail } });
    await resetTokenRecord.destroy();
    context.log('[password-reset/] Password updated successfully for:', userEmail);
    context.res = {
      status: 200,
      body: { message: 'Password has been reset successfully.' },
    };
    context.log('=== [password-reset/index.js] END (success) ===');
  } catch (err) {
    context.log.error('[password-reset/] Error:', err);
    context.res = {
      status: 500,
      body: { error: 'Internal Server Error' },
    };
    context.log('=== [password-reset/index.js] END (error) ===');
  }
};
