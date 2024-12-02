module.exports = function (context, req, next) {
  req.rawBody = context.bindingData.req.rawBody;
  next();
};
