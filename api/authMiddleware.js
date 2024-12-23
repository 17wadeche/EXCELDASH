// authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = function (context, req, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    context.log.error('Authorization header missing.');
    context.res = {
      status: 401,
      body: { error: 'Authorization header missing.' },
    };
    return next();
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    context.log.error('Bearer token missing.');
    context.res = {
      status: 401,
      body: { error: 'Bearer token missing.' },
    };
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userEmail = decoded.email;
    context.log(`AuthMiddleware: userEmail from JWT -> ${req.userEmail}`);
    return next();
  } catch (error) {
    context.log.error('Invalid token:', error.message);
    context.res = {
      status: 401,
      body: { error: 'Invalid token.' },
    };
    return next();
  }
};
