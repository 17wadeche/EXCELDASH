// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

module.exports = function (context, req, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    context.res = {
      status: 401,
      body: { error: 'Authorization header missing.' },
    };
    return;
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    context.res = {
      status: 401,
      body: { error: 'Token missing.' },
    };
    return;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    context.res = {
      status: 401,
      body: { error: 'Invalid token.' },
    };
  }
};
