const DesktopRoutes = require('./DesktopRoutes');

module.exports = function createRoutes(context) {
  const api = context.extensionApi;
  if (context.gateway && context.gateway.port) api.setGatewayPort(context.gateway.port);
  return new DesktopRoutes({
    registry: api.featureRegistry(),
    token: api.desktopToken(),
    clients: api.clientRegistry(),
    info: () => api.hello(),
  }).router();
};
