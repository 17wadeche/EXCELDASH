// login/index.js
const initializeModels = require('../models');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

module.exports = async function (context, req) {
  context.log('=== [login/index.js] START ===');
  context.log('[login] process.env.JWT_SECRET is set?', !!process.env.JWT_SECRET);
  if (process.env.JWT_SECRET) {
    context.log(`[login] JWT_SECRET length: ${process.env.JWT_SECRET.length}`);
  }

  context.log('[login] Incoming body:', JSON.stringify(req.body, null, 2));
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    context.log.error('[login] Validation error:', error.details[0].message);
    context.res = {
      status: 400,
      body: { error: error.details[0].message },
    };
    context.log('=== [login/index.js] END (validation fail) ===');
    return;
  }

  const { email, password } = value;
  context.log(`[login] Valid credentials for email: ${email}`);

  try {
    context.log('[login] Initializing models...');
    const { User, RefreshToken } = await initializeModels();
    context.log('[login] Models loaded. Querying user by userEmail:', email);

    const user = await User.findOne({ where: { userEmail: email } });
    context.log('[login] User found?', !!user);

    if (!user) {
      context.log.error('[login] User not found. Returning 401...');
      context.res = {
        status: 401,
        body: { error: 'Invalid email or password.' },
      };
      context.log('=== [login/index.js] END (no user) ===');
      return;
    }

    context.log('[login] Comparing password...');
    const passwordMatch = await bcrypt.compare(password, user.password);
    context.log('[login] Password match result:', passwordMatch);

    if (!passwordMatch) {
      context.log.error('[login] Password mismatch for userEmail:', email);
      context.res = {
        status: 401,
        body: { error: 'Invalid email or password.' },
      };
      context.log('=== [login/index.js] END (pw mismatch) ===');
      return;
    }
    context.log('[login] Removing existing refresh tokens for the user...');
    await RefreshToken.destroy({
      where: { userEmail: user.userEmail },
    });
    const sessionId = uuidv4();
    context.log('[login] Setting currentSessionId on user:', sessionId);
    await User.update(
      { currentSessionId: sessionId },
      { where: { userEmail: user.userEmail } }
    );
    context.log('[login] Generating JWT...');
    const accessToken = jwt.sign(
      { userEmail: user.userEmail, sessionId }, 
      process.env.JWT_SECRET, 
      { expiresIn: '90d' }
    );
    context.log('[login] Generating refresh token record...');
    const refreshTokenValue = uuidv4();
    const refreshTokenExpires = new Date();
    refreshTokenExpires.setDate(refreshTokenExpires.getDate() + 90);
    await RefreshToken.create({
      token: refreshTokenValue,
      userEmail: user.userEmail,
      expiresAt: refreshTokenExpires,
    });
    context.log('[login] Login success! Returning tokens...');
    context.res = {
      status: 200,
      body: {
        token: accessToken,
        refreshToken: refreshTokenValue,
      },
    };
    context.log('=== [login/index.js] END (success) ===');
  } catch (err) {
    context.log.error('[login] Error logging in:', err);
    context.res = {
      status: 500,
      body: { error: 'Internal Server Error' },
    };
    context.log('=== [login/index.js] END (catch) ===');
  }
};