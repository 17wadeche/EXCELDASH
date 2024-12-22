// login/index.js

const initializeModels = require('../models');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

module.exports = async function (context, req) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });
  const { error, value } = schema.validate(req.body);
  if (error) {
    context.res = {
      status: 400,
      body: { error: error.details[0].message },
    };
    return;
  }
  const { email, password } = value;
  try {
    const { User, RefreshToken } = await initializeModels();
    const user = await User.findOne({ where: { email } });
    if (!user) {
      context.res = {
        status: 401,
        body: { error: 'Invalid email or password.' },
      };
      return;
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      context.res = {
        status: 401,
        body: { error: 'Invalid email or password.' },
      };
      return;
    }
    const accessToken = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '30d', // or shorter
    });
    const refreshTokenValue = uuidv4();
    const refreshTokenExpires = new Date();
    refreshTokenExpires.setDate(refreshTokenExpires.getDate() + 90);

    await RefreshToken.create({
      token: refreshTokenValue,
      userId: user.id,
      expiresAt: refreshTokenExpires
    });
    context.res = {
      status: 200,
      body: { 
        token: accessToken, 
        refreshToken: refreshTokenValue 
      },
    };
  } catch (error) {
    context.log.error('Error logging in:', error);
    context.res = {
      status: 500,
      body: { error: 'Internal Server Error' },
    };
  }
};
