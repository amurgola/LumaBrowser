const DesktopIntegrationExtension = require('./DesktopIntegrationExtension');

const extension = new DesktopIntegrationExtension();

module.exports = {
  activate: (context) => extension.activate(context),
  deactivate: () => extension.deactivate(),
  getApi: () => extension.getApi(),
};
