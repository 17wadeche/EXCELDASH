// login/index.js
const initializeModels = require('../models');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { debugLog } = require('../loggingHelper');

module.exports = async function (context, req) {
  debugLog(context, '=== [login/index.js] START ===');
  debugLog(context, '[login] process.env.JWT_SECRET is set?', !!process.env.JWT_SECRET);

  if (process.env.JWT_SECRET) {
    debugLog(context, `[login] JWT_SECRET length: ${process.env.JWT_SECRET.length}`);
  }

  debugLog(context, '[login] Incoming body:', req.body);

  // Validate request body
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    debugLog(context, '[login] Validation error:', error.details[0].message);
    context.res = {
      status: 400,
      body: { error: error.details[0].message },
    };
    debugLog(context, '=== [login/index.js] END (validation fail) ===');
    return;
  }

  const { email, password } = value;
  debugLog(context, `[login] Valid credentials for email: ${email}`);

  try {
    debugLog(context, '[login] Initializing models...');
    const { User, RefreshToken } = await initializeModels();
    debugLog(context, '[login] Models loaded. Querying user by userEmail:', email);

    const user = await User.findOne({ where: { userEmail: email } });
    debugLog(context, '[login] User found?', !!user);

    if (!user) {
      debugLog(context, '[login] User not found. Returning 401...');
      context.res = {
        status: 401,
        body: { error: 'Invalid email or password.' },
      };
      debugLog(context, '=== [login/index.js] END (no user) ===');
      return;
    }

    debugLog(context, '[login] Comparing password...');
    const passwordMatch = await bcrypt.compare(password, user.password);
    debugLog(context, '[login] Password match result:', passwordMatch);

    if (!passwordMatch) {
      debugLog(context, '[login] Password mismatch. Returning 401...');
      context.res = {
        status: 401,
        body: { error: 'Invalid email or password.' },
      };
      debugLog(context, '=== [login/index.js] END (pw mismatch) ===');
      return;
    }

    // Generate JWT
    debugLog(context, '[login] Generating JWT token...');
    const accessToken = jwt.sign({ userEmail: user.userEmail }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    // Generate refresh token
    debugLog(context, '[login] Generating refresh token...');
    const refreshTokenValue = uuidv4();
    const refreshTokenExpires = new Date();
    refreshTokenExpires.setDate(refreshTokenExpires.getDate() + 90);

    // Store refresh token in DB
    debugLog(context, '[login] Creating RefreshToken record in DB...');
    await RefreshToken.create({
      token: refreshTokenValue,
      userEmail: user.userEmail,
      expiresAt: refreshTokenExpires,
    });

    debugLog(context, '[login] Login success. Responding with token + refreshToken...');
    context.res = {
      status: 200,
      body: {
        token: accessToken,
        refreshToken: refreshTokenValue,
      },
    };
    debugLog(context, '=== [login/index.js] END (success) ===');
  } catch (error) {
    debugLog(context, '[login] Error logging in:', error);
    context.res = {
      status: 500,
      body: { error: 'Internal Server Error' },
    };
    debugLog(context, '=== [login/index.js] END (catch) ===');
  }
};
