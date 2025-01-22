// password-reset/confirm/index.js
const initializeModels = require('../models');
const Joi = require('joi');
const bcrypt = require('bcryptjs');

module.exports = async function (context, req) {
  context.log('=== [password-reset/confirm/index.js] START ===');

  const schema = Joi.object({
    // Instead of requiring a UUID, just require a string of length 6
    token: Joi.string().length(6).required(),
    newPassword: Joi.string().min(6).required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    context.log.error('[password-reset/confirm] Validation error:', error.details[0].message);
    context.res = {
      status: 400,
      body: { error: error.details[0].message },
    };
    return;
  }

  const { token, newPassword } = value;

  try {
    const { User, PasswordResetToken, RefreshToken } = await initializeModels();
    context.log('[password-reset/confirm] Models loaded.');

    // Look up the 6-digit code
    const resetTokenRecord = await PasswordResetToken.findOne({ where: { token } });
    if (!resetTokenRecord) {
      context.log.error('[password-reset/confirm] Invalid token:', token);
      context.res = {
        status: 400,
        body: { error: 'Invalid or expired code.' },
      };
      return;
    }

    // Check if token is expired
    if (resetTokenRecord.expiresAt < new Date()) {
      context.log.error('[password-reset/confirm] Token expired:', token);
      await resetTokenRecord.destroy(); // cleanup
      context.res = {
        status: 400,
        body: { error: 'Invalid or expired code.' },
      };
      return;
    }

    // Find user
    const userEmail = resetTokenRecord.userEmail;
    const user = await User.findOne({ where: { userEmail } });
    if (!user) {
      context.log.error('[password-reset/confirm] User not found for token:', token);
      context.res = {
        status: 400,
        body: { error: 'Invalid code.' },
      };
      return;
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.update({ password: hashedPassword }, { where: { userEmail } });

    // Invalidate old refresh tokens (best practice)
    await RefreshToken.destroy({ where: { userEmail } });

    // Destroy the reset code record so it can't be reused
    await resetTokenRecord.destroy();

    context.log('[password-reset/confirm] Password updated successfully for:', userEmail);
    context.res = {
      status: 200,
      body: { message: 'Password has been reset successfully.' },
    };
  } catch (err) {
    context.log.error('[password-reset/confirm] Error:', err);
    context.res = {
      status: 500,
      body: { error: 'Internal Server Error' },
    };
  }

  context.log('=== [password-reset/confirm/index.js] END ===');
};
