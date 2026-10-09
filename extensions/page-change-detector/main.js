const PageChangeDetectorExtension = require('./PageChangeDetectorExtension');

const extension = new PageChangeDetectorExtension();

module.exports = {
  activate: (context) => extension.activate(context),
  deactivate: () => extension.deactivate(),
  getApi: () => extension.getApi(),
};
