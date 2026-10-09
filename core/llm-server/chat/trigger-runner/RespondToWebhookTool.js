class RespondToWebhookTool {
  static MAX_BODY_CHARS = 256 * 1024;

  constructor(onBody) {
    this._onBody = onBody;
  }

  definition() {
    return {
      name: 'respond_to_webhook',
      description: 'Set the HTTP response body the webhook sender receives for this event. '
        + 'Pass `body` as a JSON object (sent as application/json) or a string (sent as text). '
        + 'Call at most once; the last call wins.',
      inputSchema: {
        type: 'object',
        properties: { body: { description: 'JSON object or plain-text string to return to the sender' } },
        required: ['body'],
      },
      handler: async (params = {}) => this._respond(params.body),
    };
  }

  _respond(body) {
    let accepted = body;
    if (typeof accepted === 'string' && accepted.length > RespondToWebhookTool.MAX_BODY_CHARS) {
      accepted = accepted.slice(0, RespondToWebhookTool.MAX_BODY_CHARS);
    }
    if (accepted && typeof accepted === 'object' && JSON.stringify(accepted).length > RespondToWebhookTool.MAX_BODY_CHARS) {
      return { success: false, error: 'response body too large' };
    }
    this._onBody(accepted);
    return { success: true };
  }
}

module.exports = RespondToWebhookTool;
