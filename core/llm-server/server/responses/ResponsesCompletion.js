const TranslatedChatCompletion = require('../relay/TranslatedChatCompletion');
const ResponsesError = require('./ResponsesError');
const ResponsesResponseTranslator = require('./ResponsesResponseTranslator');

class ResponsesCompletion extends TranslatedChatCompletion {
  static LOG_LABEL = 'responses';

  static SERVER_STATUS = 500;

  _translate(completion) {
    return ResponsesResponseTranslator.translate(completion, this._upstream.modelId, this._context || {});
  }

  _sendError(status, message) {
    const type = status >= ResponsesCompletion.SERVER_STATUS ? 'server_error' : 'invalid_request_error';
    return ResponsesError.send(this._res, status, type, message, { code: ResponsesError.codeFor(message) });
  }
}

module.exports = ResponsesCompletion;
