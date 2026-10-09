const NtfyNotifierExtension = require('./NtfyNotifierExtension');

const extension = new NtfyNotifierExtension();

module.exports = {
  activate: (context) => extension.activate(context),
  deactivate: () => extension.deactivate(),
};
