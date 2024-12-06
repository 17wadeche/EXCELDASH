const initializeModels = require('../models');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
    const { User } = await initializeModels();

    const user = await User.findOne({ where: { email } });
    if (!user) {
      context.res = {
        status: 400,
        body: { error: 'Invalid email or password.' },
      };
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      context.res = {
        status: 400,
        body: { error: 'Invalid email or password.' },
      };
      return;
    }

    const token = jwt.sign({ userId: user.subscription_id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    context.res = {
      status: 200,
      body: { token },
    };
  } catch (error) {
    context.log.error('Error logging in:', error);
    context.res = {
      status: 500,
      body: { error: 'Internal Server Error' },
    };
  }
};
