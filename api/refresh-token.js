//refresh-token.js

const initializeModels = require('../models');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

module.exports = async function (context, req) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    context.res = {
      status: 400,
      body: { error: 'Refresh token is required.' },
    };
    return;
  }
  try {
    const { RefreshToken, User } = await initializeModels();
    const storedToken = await RefreshToken.findOne({ where: { token: refreshToken } });
    if (!storedToken) {
      context.res = {
        status: 401,
        body: { error: 'Invalid refresh token.' },
      };
      return;
    }
    if (new Date() > storedToken.expiresAt) {
      context.res = {
        status: 401,
        body: { error: 'Refresh token expired.' },
      };
      return;
    }
    const userEmail = storedToken.userEmail;
    const newAccessToken = jwt.sign({ email: userEmail }, process.env.JWT_SECRET, {
      expiresIn: '90d',
    });
    const newRefreshToken = uuidv4();
    const newExpires = new Date();
    newExpires.setDate(newExpires.getDate() + 90);
    await storedToken.update({
      token: newRefreshToken,
      expiresAt: newExpires
    });

    context.res = {
      status: 200,
      body: {
        token: newAccessToken,
        refreshToken: newRefreshToken
      },
    };
  } catch (error) {
    context.log.error('Error refreshing token:', error);
    context.res = {
      status: 500,
      body: { error: 'Internal Server Error' },
    };
  }
};
