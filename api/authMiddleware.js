// authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = function (context, req, next) {
  context.log('=== [authMiddleware] START ===');
  context.log('[authMiddleware] Incoming headers:', JSON.stringify(req.headers, null, 2));
  const authHeader = req.headers['x-custom-auth'];
  if (!authHeader) {
    context.log.error('[authMiddleware] X-Custom-Auth header missing.');
    context.res = {
      status: 401,
      body: { error: 'X-Custom-Auth header missing.' },
    };
    return next();
  }
  context.log('[authMiddleware] X-Custom-Auth header value:', authHeader);
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
  try {
    context.log('[authMiddleware] Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    context.log('[authMiddleware] Decoded token:', decoded);
    const { userEmail, sessionId } = decoded;
    if (!userEmail || !sessionId) {
      throw new Error('Token is missing userEmail or sessionId.');
    }
    const { User } = await initializeModels();
    const user = await User.findOne({
      where: { userEmail },
      attributes: ['currentSessionId'], // or whatever field you’re using
    });
    if (!user) {
      context.log.error('[authMiddleware] No user found with that email.');
      context.res = {
        status: 401,
        body: { error: 'Invalid token: user not found.' },
      };
      return next();
    }
    if (user.currentSessionId !== sessionId) {
      context.log.error('[authMiddleware] Session ID mismatch => This session is invalid.');
      context.res = {
        status: 401,
        body: { error: 'Session is no longer valid. Please log in again.' },
      };
      return next();
    }
    req.userEmail = userEmail;
    context.log(`[authMiddleware] userEmail => ${req.userEmail}, sessionId => ${sessionId}`);
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