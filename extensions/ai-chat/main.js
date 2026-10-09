const AiChatExtension = require('./AiChatExtension');

const extension = new AiChatExtension();

module.exports = {
  activate: (context) => extension.activate(context),
  deactivate: () => extension.deactivate(),
};
