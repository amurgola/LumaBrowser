const TranslatedChatCompletion = require('../relay/TranslatedChatCompletion');
const AnthropicError = require('./AnthropicError');
const MessagesResponseTranslator = require('./MessagesResponseTranslator');

class MessagesCompletion extends TranslatedChatCompletion {
  static LOG_LABEL = 'messages';

  _translate(completion) {
    return MessagesResponseTranslator.translate(completion, this._upstream.modelId);
  }

  _sendError(status, message) {
    return AnthropicError.send(this._res, status, 'api_error', message);
  }
}

module.exports = MessagesCompletion;
