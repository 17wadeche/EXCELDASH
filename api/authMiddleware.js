// authMiddleware.js
const jwt = require('jsonwebtoken');
const { debugLog } = require('../loggingHelper');

module.exports = function (context, req, next) {
  debugLog(context, '=== [authMiddleware] START ===');
  debugLog(context, '[authMiddleware] Incoming headers:', req.headers);
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    debugLog(context, '[authMiddleware] Authorization header missing.');
    context.res = {
      status: 401,
      body: { error: 'Authorization header missing.' },
    };
    debugLog(context, '=== [authMiddleware] END (no authHeader) ===');
    return next();
  }
  debugLog(context, '[authMiddleware] Authorization header value:', authHeader);
  const token = authHeader.split(' ')[1];
  debugLog(context, '[authMiddleware] Extracted token:', token);
  if (!token) {
    debugLog(context, '[authMiddleware] Bearer token missing.');
    context.res = {
      status: 401,
      body: { error: 'Bearer token missing.' },
    };
    debugLog(context, '=== [authMiddleware] END (no token) ===');
    return next();
  }
  if (!process.env.JWT_SECRET) {
    debugLog(context, '[authMiddleware] JWT_SECRET is undefined or empty in Azure!');
  } else {
    debugLog(context, `[authMiddleware] JWT_SECRET length: ${process.env.JWT_SECRET.length}`);
  }
  try {
    debugLog(context, '[authMiddleware] Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    debugLog(context, '[authMiddleware] Decoded token:', decoded);
    req.userEmail = decoded.userEmail;
    debugLog(context, `[authMiddleware] userEmail from JWT -> ${req.userEmail}`);
    debugLog(context, '=== [authMiddleware] END (success) ===');
    return next();
  } catch (error) {
    debugLog(context, '[authMiddleware] Invalid token:', error.message);
    debugLog(context, '[authMiddleware] Received token:', token);
    context.res = {
      status: 401,
      body: { error: 'Invalid token.' },
    };
    debugLog(context, '=== [authMiddleware] END (error) ===');
    return next();
  }
};
