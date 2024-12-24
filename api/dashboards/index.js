// dashboard/index.js
const initializeModels = require('../models');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../authMiddleware');
const { debugLog } = require('../loggingHelper');

module.exports = async function (context, req) {
  debugLog(context, '=== [dashboard/index.js] START ===');
  debugLog(context, '[dashboard] Received method:', req.method, 'params:', req.params);
  debugLog(context, '[dashboard] Body:', req.body);

  // Run auth middleware first
  debugLog(context, '[dashboard] Invoking authMiddleware...');
  await new Promise((resolve) => authMiddleware(context, req, resolve));
  
  // If authMiddleware set an error response, exit
  if (context.res && context.res.body && context.res.body.error) {
    debugLog(context, '[dashboard] authMiddleware error found. Early return.');
    debugLog(context, '=== [dashboard/index.js] END (auth fail) ===');
    return;
  }

  const method = req.method.toLowerCase();
  const id = req.params.id;
  const userEmail = req.userEmail;

  // Check if userEmail is present
  debugLog(context, `[dashboard] userEmail from req: ${userEmail}`);
  if (!userEmail) {
    debugLog(context, '[dashboard] No userEmail found. Returning 401...');
    context.res = {
      status: 401,
      body: { error: 'Unauthorized access (missing userEmail).' },
    };
    debugLog(context, '=== [dashboard/index.js] END (no userEmail) ===');
    return;
  }

  try {
    debugLog(context, '[dashboard] About to initialize models...');
    const { Dashboard } = await initializeModels();
    debugLog(context, '[dashboard] Models initialized successfully.');

    if (method === 'post') {
      debugLog(context, '[dashboard] Handling POST...');
      const { title, components, layouts, workbookId, borderSettings } = req.body;
      debugLog(context, '[dashboard] POST details:', { title, components, layouts, workbookId, borderSettings });
      debugLog(context, '[dashboard] userEmail from token:', userEmail);

      if (!title || !components || !layouts || !workbookId) {
        debugLog(context, '[dashboard] Missing required fields. Returning 400...');
        context.res = {
          status: 400,
          body: { error: 'title, components, layouts, and workbookId are required.' },
        };
        debugLog(context, '=== [dashboard/index.js] END (post validation fail) ===');
        return;
      }

      const normalizedWorkbookId = workbookId.toLowerCase();
      debugLog(context, '[dashboard] Creating new dashboard record...');
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
      debugLog(context, '[dashboard] POST success, returning new dashboard.');
    } 
    else if (method === 'get') {
      debugLog(context, '[dashboard] Handling GET...');
      if (id) {
        debugLog(context, '[dashboard] Getting dashboard by ID:', id);
        const dashboard = await Dashboard.findByPk(id);
        debugLog(context, '[dashboard] Found dashboard? ', !!dashboard);

        if (!dashboard) {
          debugLog(context, '[dashboard] Dashboard not found. Returning 404...');
          context.res = { status: 404, body: { error: 'Dashboard not found' } };
        } else if (dashboard.userEmail !== userEmail) {
          debugLog(context, '[dashboard] userEmail mismatch. Access denied.');
          context.res = { status: 403, body: { error: 'Access denied.' } };
        } else {
          context.res = { status: 200, body: dashboard };
          debugLog(context, '[dashboard] Returning single dashboard data.');
        }
      } else {
        debugLog(context, '[dashboard] Getting all dashboards for userEmail:', userEmail);
        const dashboards = await Dashboard.findAll({ where: { userEmail } });
        debugLog(context, '[dashboard] Found dashboards count:', dashboards.length);
        context.res = { status: 200, body: dashboards };
      }
    } 
    else if (method === 'put') {
      debugLog(context, '[dashboard] Handling PUT, ID:', id);
      if (!id) {
        debugLog(context, '[dashboard] No ID provided. Returning 400...');
        context.res = {
          status: 400,
          body: { error: 'Dashboard ID is required for updating.' },
        };
        debugLog(context, '=== [dashboard/index.js] END (no ID) ===');
        return;
      }

      const { title, components, layouts, workbookId, borderSettings } = req.body;
      debugLog(context, '[dashboard] Fields to update:', { title, components, layouts, workbookId, borderSettings });

      const dashboard = await Dashboard.findByPk(id);
      debugLog(context, '[dashboard] Found dashboard? ', !!dashboard);
      if (!dashboard) {
        debugLog(context, '[dashboard] Dashboard not found. Returning 404...');
        context.res = { status: 404, body: { error: 'Dashboard not found' } };
      } else if (dashboard.userEmail !== userEmail) {
        debugLog(context, '[dashboard] userEmail mismatch. Returning 403...');
        context.res = { status: 403, body: { error: 'Access denied.' } };
      } else {
        if (title !== undefined) dashboard.title = title;
        if (components !== undefined) dashboard.components = components;
        if (layouts !== undefined) dashboard.layouts = layouts;
        if (workbookId !== undefined) dashboard.workbookId = workbookId.toLowerCase();
        if (borderSettings !== undefined) dashboard.borderSettings = borderSettings;

        debugLog(context, '[dashboard] Saving updated dashboard...');
        await dashboard.save();
        context.res = { status: 200, body: dashboard };
        debugLog(context, '[dashboard] PUT success, returning updated dashboard.');
      }
    } 
    else if (method === 'delete') {
      debugLog(context, '[dashboard] Handling DELETE, ID:', id);
      if (!id) {
        debugLog(context, '[dashboard] No ID provided. Returning 400...');
        context.res = {
          status: 400,
          body: { error: 'Dashboard ID is required for deleting.' },
        };
        debugLog(context, '=== [dashboard/index.js] END (no ID) ===');
        return;
      }
      const dashboard = await Dashboard.findByPk(id);
      debugLog(context, '[dashboard] Found dashboard? ', !!dashboard);

      if (!dashboard) {
        debugLog(context, '[dashboard] Dashboard not found. Returning 404...');
        context.res = { status: 404, body: { error: 'Dashboard not found' } };
      } else if (dashboard.userEmail !== userEmail) {
        debugLog(context, '[dashboard] userEmail mismatch. Returning 403...');
        context.res = { status: 403, body: { error: 'Access denied.' } };
      } else {
        debugLog(context, '[dashboard] Destroying dashboard...');
        await dashboard.destroy();
        context.res = { status: 200, body: { message: 'Dashboard deleted successfully' } };
        debugLog(context, '[dashboard] DELETE success.');
      }
    } 
    else {
      debugLog(context, '[dashboard] Method not allowed:', req.method);
      context.res = { status: 405, body: { error: 'Method not allowed.' } };
    }

    debugLog(context, '=== [dashboard/index.js] END (success) ===');
  } catch (error) {
    debugLog(context, '[dashboard] Error handling dashboard request:', error);
    context.res = { status: 500, body: { error: error.message } };
    debugLog(context, '=== [dashboard/index.js] END (catch) ===');
  }
};
