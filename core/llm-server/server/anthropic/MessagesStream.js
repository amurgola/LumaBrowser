const TranslatedChatStream = require('../relay/TranslatedChatStream');
const MessagesStreamTranslator = require('./MessagesStreamTranslator');

class MessagesStream extends TranslatedChatStream {
  _createTranslator(emit) {
    return new MessagesStreamTranslator({ modelId: this._upstream.modelId, emit });
  }
}

module.exports = MessagesStream;
