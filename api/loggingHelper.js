// loggingHelper.js
module.exports.debugLog = function debugLog(context, ...args) {
  // Join messages or objects into a single string
  const message = args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : a)).join(' ');
  
  // Log to Azure Functions
  context.log(message);
  
  // Log to Node console
  console.log(message);
};
