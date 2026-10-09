const IkLlamaActivation = require('./IkLlamaActivation');

module.exports = {
  activate: (context) => IkLlamaActivation.activate(context),
  deactivate: async () => {},
};
