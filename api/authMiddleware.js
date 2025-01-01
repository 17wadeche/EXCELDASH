// authMiddleware.js
const jwt = require('jsonwebtoken');
const initializeModels = require('../models');

module.exports = async function (context, req, next) {
  context.log('=== [authMiddleware] START ===');
  context.log('[authMiddleware] Incoming headers:', JSON.stringify(req.headers, null, 2));
  const authHeader = req.headers['x-custom-auth'];
  if (!authHeader) {
    context.log.error('[authMiddleware] X-Custom-Auth header missing.');
    context.res = {
      status: 401,
      body: { error: 'X-Custom-Auth header missing.' },
    };
    context.log('=== [authMiddleware] END (missing header) ===');
    return next(); // or just `return;` if you’re not using an Express-like pattern
  }
  context.log('[authMiddleware] X-Custom-Auth header value:', authHeader);
  const token = authHeader.split(' ')[1];
  context.log('[authMiddleware] Extracted token:', token);
  if (!token) {
    context.log.error('[authMiddleware] Bearer token missing after splitting auth header.');
    context.res = {
      status: 401,
      body: { error: 'Bearer token missing.' },
    };
    context.log('=== [authMiddleware] END (no bearer) ===');
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
    context.log(`[authMiddleware] userEmail => ${userEmail}, sessionId => ${sessionId}`);
    const { User } = await initializeModels();
    const user = await User.findOne({
      where: { userEmail },
      attributes: ['currentSessionId'],
    });
    if (!user) {
      context.log.error('[authMiddleware] No user found with that email:', userEmail);
      context.res = {
        status: 401,
        body: { error: 'Invalid token: user not found.' },
      };
      context.log('=== [authMiddleware] END (no user) ===');
      return next();
    }
    context.log('[authMiddleware] Found user:', userEmail, 'with currentSessionId:', user.currentSessionId);
    if (user.currentSessionId !== sessionId) {
      context.log.error('[authMiddleware] Session ID mismatch => This session is invalid.');
      context.res = {
        status: 401,
        body: { error: 'Session is no longer valid. Please log in again.' },
      };
      context.log('=== [authMiddleware] END (session mismatch) ===');
      return next();
    }
    req.userEmail = userEmail;
    context.log('=== [authMiddleware] END (success) ===');
    return next();
  } catch (error) {
    context.log.error('[authMiddleware] Token verification failed:', error.message);
    context.log('[authMiddleware] Received token:', token);
    context.res = {
      status: 401,
      body: { error: 'Invalid token.' },
    };
    context.log('=== [authMiddleware] END (error) ===');
    return next();
  }
};