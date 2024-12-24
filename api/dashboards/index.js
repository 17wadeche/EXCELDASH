// dashboard/index.js
const initializeModels = require('../models');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../authMiddleware');

module.exports = async function (context, req) {
  context.log('=== [dashboard/index.js] START ===');
  context.log('[dashboard] Received method:', req.method, 'params:', req.params);
  context.log('[dashboard] Body:', JSON.stringify(req.body, null, 2));

  // Run auth middleware first
  context.log('[dashboard] Invoking authMiddleware...');
  await new Promise((resolve) => authMiddleware(context, req, resolve));
  
  // If authMiddleware set an error response, exit
  if (context.res && context.res.body && context.res.body.error) {
    context.log('[dashboard] authMiddleware error found. Early return.');
    context.log('=== [dashboard/index.js] END (auth fail) ===');
    return;
  }

  const method = req.method.toLowerCase();
  const id = req.params.id;
  const userEmail = req.userEmail;

  // Check if userEmail is present
  context.log(`[dashboard] userEmail from req: ${userEmail}`);
  if (!userEmail) {
    context.log.error('[dashboard] No userEmail found. Returning 401...');
    context.res = {
      status: 401,
      body: { error: 'Unauthorized access (missing userEmail).' },
    };
    context.log('=== [dashboard/index.js] END (no userEmail) ===');
    return;
  }

  try {
    context.log('[dashboard] About to initialize models...');
    const { Dashboard } = await initializeModels();
    context.log('[dashboard] Models initialized successfully.');

    if (method === 'post') {
      context.log('[dashboard] Handling POST...');
      const { title, components, layouts, workbookId, borderSettings } = req.body;
      context.log('[dashboard] POST details:', { title, components, layouts, workbookId, borderSettings });
      context.log('[dashboard] userEmail from token:', userEmail);
      if (!title || !components || !layouts || !workbookId) {
        context.log.error('[dashboard] Missing required fields. Returning 400...');
        context.res = {
          status: 400,
          body: { error: 'title, components, layouts, and workbookId are required.' },
        };
        context.log('=== [dashboard/index.js] END (post validation fail) ===');
        return;
      }
      const normalizedWorkbookId = workbookId.toLowerCase();
      context.log('[dashboard] Creating new dashboard record...');
      const newDashboard = await Dashboard.create({
        id: uuidv4(),
        title,
        components,
        layouts,
        workbookId: normalizedWorkbookId,
        userEmail,
        versions: [],
        borderSettings: borderSettings || undefined,
      });
      context.res = { status: 200, body: newDashboard };
      context.log('[dashboard] POST success, returning new dashboard.');
    } 
    else if (method === 'get') {
      context.log('[dashboard] Handling GET...');
      if (id) {
        context.log('[dashboard] Getting dashboard by ID:', id);
        const dashboard = await Dashboard.findByPk(id);
        context.log('[dashboard] Found dashboard? ', !!dashboard);
        if (!dashboard) {
          context.log.error('[dashboard] Dashboard not found. Returning 404...');
          context.res = { status: 404, body: { error: 'Dashboard not found' } };
        } else if (dashboard.userEmail !== userEmail) {
          context.log.error('[dashboard] userEmail mismatch. Access denied.');
          context.res = { status: 403, body: { error: 'Access denied.' } };
        } else {
          context.res = { status: 200, body: dashboard };
          context.log('[dashboard] Returning single dashboard data.');
        }
      } else {
        context.log('[dashboard] Getting all dashboards for userEmail:', userEmail);
        const dashboards = await Dashboard.findAll({ where: { userEmail } });
        context.log('[dashboard] Found dashboards count:', dashboards.length);
        context.res = { status: 200, body: dashboards };
      }
    } 
    else if (method === 'put') {
      context.log('[dashboard] Handling PUT, ID:', id);
      if (!id) {
        context.log.error('[dashboard] No ID provided. Returning 400...');
        context.res = {
          status: 400,
          body: { error: 'Dashboard ID is required for updating.' },
        };
        context.log('=== [dashboard/index.js] END (no ID) ===');
        return;
      }
      const { title, components, layouts, workbookId, borderSettings } = req.body;
      context.log('[dashboard] Fields to update:', { title, components, layouts, workbookId, borderSettings });
      const dashboard = await Dashboard.findByPk(id);
      context.log('[dashboard] Found dashboard? ', !!dashboard);
      if (!dashboard) {
        context.log.error('[dashboard] Dashboard not found. Returning 404...');
        context.res = { status: 404, body: { error: 'Dashboard not found' } };
      } else if (dashboard.userEmail !== userEmail) {
        context.log.error('[dashboard] userEmail mismatch. Returning 403...');
        context.res = { status: 403, body: { error: 'Access denied.' } };
      } else {
        if (title !== undefined) dashboard.title = title;
        if (components !== undefined) dashboard.components = components;
        if (layouts !== undefined) dashboard.layouts = layouts;
        if (workbookId !== undefined) dashboard.workbookId = workbookId.toLowerCase();
        if (borderSettings !== undefined) dashboard.borderSettings = borderSettings;

        context.log('[dashboard] Saving updated dashboard...');
        await dashboard.save();
        context.res = { status: 200, body: dashboard };
        context.log('[dashboard] PUT success, returning updated dashboard.');
      }
    } 
    else if (method === 'delete') {
      context.log('[dashboard] Handling DELETE, ID:', id);
      if (!id) {
        context.log.error('[dashboard] No ID provided. Returning 400...');
        context.res = {
          status: 400,
          body: { error: 'Dashboard ID is required for deleting.' },
        };
        context.log('=== [dashboard/index.js] END (no ID) ===');
        return;
      }
      const dashboard = await Dashboard.findByPk(id);
      context.log('[dashboard] Found dashboard? ', !!dashboard);
      if (!dashboard) {
        context.log.error('[dashboard] Dashboard not found. Returning 404...');
        context.res = { status: 404, body: { error: 'Dashboard not found' } };
      } else if (dashboard.userEmail !== userEmail) {
        context.log.error('[dashboard] userEmail mismatch. Returning 403...');
        context.res = { status: 403, body: { error: 'Access denied.' } };
      } else {
        context.log('[dashboard] Destroying dashboard...');
        await dashboard.destroy();
        context.res = { status: 200, body: { message: 'Dashboard deleted successfully' } };
        context.log('[dashboard] DELETE success.');
      }
    } 
    else {
      context.log.error('[dashboard] Method not allowed:', req.method);
      context.res = { status: 405, body: { error: 'Method not allowed.' } };
    }
    context.log('=== [dashboard/index.js] END (success) ===');
  } catch (error) {
    context.log.error('[dashboard] Error handling dashboard request:', error);
    context.res = { status: 500, body: { error: error.message } };
    context.log('=== [dashboard/index.js] END (catch) ===');
  }
};