const CdpDriverExtension = require('./CdpDriverExtension');

const extension = new CdpDriverExtension();

module.exports = {
  activate: (context) => extension.activate(context),
  deactivate: () => extension.deactivate(),
};
