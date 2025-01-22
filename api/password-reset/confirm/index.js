// password-reset/confirm/index.js

const initializeModels = require('../../models');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = async function (context, req) {
  context.log('=== [password-reset/confirm/index.js] START ===');

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
    context.log('=== [password-reset/confirm/index.js] END (validation fail) ===');
    return;
  }

  const { token, newPassword } = value;

  try {
    const { User, PasswordResetToken, RefreshToken } = await initializeModels();
    context.log('[password-reset/confirm] Models loaded.');

    const resetTokenRecord = await PasswordResetToken.findOne({ where: { token } });
    if (!resetTokenRecord) {
      context.log.error('[password-reset/confirm] Invalid token:', token);
      context.res = {
        status: 400,
        body: { error: 'Invalid or expired token.' },
      };
      context.log('=== [password-reset/confirm/index.js] END (invalid token) ===');
      return;
    }

    if (resetTokenRecord.expiresAt < new Date()) {
      context.log.error('[password-reset/confirm] Token expired:', token);
      // Delete the expired token
      await resetTokenRecord.destroy();
      context.res = {
        status: 400,
        body: { error: 'Invalid or expired token.' },
      };
      context.log('=== [password-reset/confirm/index.js] END (expired token) ===');
      return;
    }

    const userEmail = resetTokenRecord.userEmail;
    const user = await User.findOne({ where: { userEmail } });

    if (!user) {
      context.log.error('[password-reset/confirm] User not found for token:', token);
      context.res = {
        status: 400,
        body: { error: 'Invalid token.' },
      };
      context.log('=== [password-reset/confirm/index.js] END (user not found) ===');
      return;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    await User.update(
      { password: hashedPassword },
      { where: { userEmail } }
    );

    // Delete all existing refresh tokens for the user
    await RefreshToken.destroy({ where: { userEmail } });

    // Invalidate the password reset token
    await resetTokenRecord.destroy();

    context.log('[password-reset/confirm] Password updated successfully for:', userEmail);
    context.res = {
      status: 200,
      body: { message: 'Password has been reset successfully.' },
    };
    context.log('=== [password-reset/confirm/index.js] END (success) ===');
  } catch (err) {
    context.log.error('[password-reset/confirm] Error:', err);
    context.res = {
      status: 500,
      body: { error: 'Internal Server Error' },
    };
    context.log('=== [password-reset/confirm/index.js] END (error) ===');
  }
};
