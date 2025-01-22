// password-reset/request/index.js

const initializeModels = require('../../models');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const { sendPasswordResetEmail } = require('../../utils/email'); // We'll define this later

module.exports = async function (context, req) {
  context.log('=== [password-reset/request/index.js] START ===');

  const schema = Joi.object({
    email: Joi.string().email().required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    context.log.error('[password-reset/request] Validation error:', error.details[0].message);
    context.res = {
      status: 400,
      body: { error: error.details[0].message },
    };
    context.log('=== [password-reset/request/index.js] END (validation fail) ===');
    return;
  }

  const { email } = value;

  try {
    const { User, PasswordResetToken } = await initializeModels();
    context.log('[password-reset/request] Models loaded.');

    const user = await User.findOne({ where: { userEmail: email } });
    if (!user) {
      context.log.error('[password-reset/request] User not found:', email);
      // For security, don't reveal that the email doesn't exist
      context.res = {
        status: 200,
        body: { message: 'If that email address is in our system, we have sent a password reset link to it.' },
      };
      context.log('=== [password-reset/request/index.js] END (user not found) ===');
      return;
    }

    // Generate a unique, secure token
    const token = uuidv4();

    // Set token expiration (e.g., 1 hour from now)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Store the token in the database
    await PasswordResetToken.create({
      userEmail: email,
      token,
      expiresAt,
    });

    // Send the password reset email
    const resetLink = `${process.env.FRONTEND_BASE_URL}/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, resetLink);

    context.log('[password-reset/request] Password reset email sent to:', email);
    context.res = {
      status: 200,
      body: { message: 'If that email address is in our system, we have sent a password reset link to it.' },
    };
    context.log('=== [password-reset/request/index.js] END (success) ===');
  } catch (err) {
    context.log.error('[password-reset/request] Error:', err);
    context.res = {
      status: 500,
      body: { error: 'Internal Server Error' },
    };
    context.log('=== [password-reset/request/index.js] END (error) ===');
  }
};
