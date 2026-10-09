class AnthropicError {
  static send(res, status, type, message) {
    return res.status(status).json(AnthropicError.body(type, message));
  }

  static body(type, message) {
    return { type: 'error', error: { type, message } };
  }
}

module.exports = AnthropicError;
