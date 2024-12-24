// authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = function (context, req, next) {
  context.log('=== [authMiddleware] START ===');
  context.log('[authMiddleware] Incoming headers:', JSON.stringify(req.headers, null, 2));
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    context.log.error('[authMiddleware] Authorization header missing.');
    context.res = {
      status: 401,
      body: { error: 'Authorization header missing.' },
    };
    return next();
  }
  context.log('[authMiddleware] Authorization header value:', authHeader);
  const token = authHeader.split(' ')[1];
  context.log('[authMiddleware] Extracted token:', token);

  if (!token) {
    context.log.error('[authMiddleware] Bearer token missing.');
    context.res = {
      status: 401,
      body: { error: 'Bearer token missing.' },
    };
    return next();
  }
  if (!process.env.JWT_SECRET) {
    context.log.error('[authMiddleware] JWT_SECRET is undefined or empty in Azure!');
  } else {
    context.log(`[authMiddleware] JWT_SECRET length: ${process.env.JWT_SECRET.length}`);
  }
  try {
    context.log('[authMiddleware] Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    context.log('[authMiddleware] Decoded token:', decoded);
    req.userEmail = decoded.userEmail;
    context.log(`[authMiddleware] userEmail from JWT -> ${req.userEmail}`);
    context.log('=== [authMiddleware] END (success) ===');
    return next();
  } catch (error) {
    context.log.error('[authMiddleware] Invalid token:', error.message);
    context.log('[authMiddleware] Received token:', token);
    context.res = {
      status: 401,
      body: { error: 'Invalid token.' },
    };
    context.log('=== [authMiddleware] END (error) ===');
    return next();
  }
};
