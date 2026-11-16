const LoraTrainerExtension = require('./LoraTrainerExtension');

const extension = new LoraTrainerExtension();

module.exports = {
  activate: (context) => extension.activate(context),
  deactivate: () => extension.deactivate(),
};
