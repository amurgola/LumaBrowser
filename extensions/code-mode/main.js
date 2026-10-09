const CodeModeExtension = require('./CodeModeExtension');
const SessionSnapshot = require('./SessionSnapshot');

module.exports = {
  _buildStateFor: (sessions, conversationId) => SessionSnapshot.forConversation(sessions, conversationId),

  async activate(context) {
    return CodeModeExtension.activate(context);
  },

  async deactivate() {},
};
