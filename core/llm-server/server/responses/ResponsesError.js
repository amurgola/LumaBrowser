class ResponsesError {
  static CONTEXT_EXCEEDED = 'context_length_exceeded';

  static SERVER_ERROR = 'server_error';

  static CONTEXT_PATTERN = /context (size|length|window)|exceeds? the (available )?context|n_ctx/i;

  static send(res, status, type, message, { code = null, param = null } = {}) {
    return res.status(status).json(ResponsesError.body(type, message, { code, param }));
  }

  static body(type, message, { code = null, param = null } = {}) {
    return { error: { message, type, param, code } };
  }

  static failure(message) {
    return { code: ResponsesError.codeFor(message) || ResponsesError.SERVER_ERROR, message };
  }

  static codeFor(message) {
    return ResponsesError.CONTEXT_PATTERN.test(String(message || '')) ? ResponsesError.CONTEXT_EXCEEDED : null;
  }
}

module.exports = ResponsesError;
