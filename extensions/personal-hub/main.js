const PersonalHubExtension = require('./PersonalHubExtension');

const extension = new PersonalHubExtension();

module.exports = {
  activate: (context) => extension.activate(context),
  deactivate: () => extension.deactivate(),
  getApi: () => extension.getApi(),
};
