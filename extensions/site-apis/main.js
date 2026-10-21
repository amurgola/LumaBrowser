const SiteApisExtension = require('./SiteApisExtension');

const extension = new SiteApisExtension();

module.exports = {
  activate: (context) => extension.activate(context),
  deactivate: () => extension.deactivate(),
  getApi: () => extension.getApi(),
  builderDescriptor: () => extension.builderDescriptor(),
};
