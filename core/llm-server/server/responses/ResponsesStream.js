const TranslatedChatStream = require('../relay/TranslatedChatStream');
const ResponsesStreamTranslator = require('./ResponsesStreamTranslator');

class ResponsesStream extends TranslatedChatStream {
  _createTranslator(emit) {
    return new ResponsesStreamTranslator({ modelId: this._upstream.modelId, context: this._context, emit });
  }
}

module.exports = ResponsesStream;
