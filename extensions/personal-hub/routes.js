const HubRoutes = require('./HubRoutes');

module.exports = function createRoutes(context) {
  const api = context.extensionApi;
  if (context.gateway && context.gateway.baseUrl && typeof api.setGatewayBaseUrl === 'function') {
    api.setGatewayBaseUrl(context.gateway.baseUrl);
  }
  return new HubRoutes({ api, inbound: api.inboundToken() }).router();
};
