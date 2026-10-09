const IdeContextFormatter = require('../chat/IdeContextFormatter');

class ChatTurnRequest {
  static async run(chatRouter, args, send) {
    try {
      const { context, ...turn } = args || {};
      return await chatRouter.chat({ ...turn, messages: IdeContextFormatter.appendToLastUserMessage(turn.messages, context), send });
    } catch (err) {
      const hints = ChatTurnRequest.hintsOf(err);
      send('error', { message: err.message, ...hints });
      return { success: false, error: err.message, ...hints };
    }
  }

  static hintsOf(err) {
    return {
      code: err.code || null,
      runtimeId: err.runtimeId || null,
      runtimeName: err.runtimeName || null,
      installable: typeof err.installable === 'boolean' ? err.installable : false,
    };
  }
}

module.exports = ChatTurnRequest;
