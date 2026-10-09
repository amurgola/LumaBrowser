const TriggerPayload = require('../TriggerPayload');
const WebhookBodyParser = require('./WebhookBodyParser');

class WebhookEvent {
  static HEADER_DENY_RE = /^(authorization|cookie|set-cookie|proxy-authorization|host)$|secret|token|signature|api-key|apikey|password/i;

  static build(req) {
    const contentType = req.headers['content-type'] || '';
    const parsed = WebhookBodyParser.parse(req.body, contentType);
    const event = {
      receivedAt: new Date().toISOString(),
      method: req.method,
      contentType: contentType || null,
      query: { ...(req.query || {}) },
      headers: WebhookEvent.safeHeaders(req.headers),
      body: parsed.body,
    };
    WebhookEvent._attachRawForms(event, parsed);
    return TriggerPayload.sanitize(event);
  }

  static safeHeaders(headers = {}) {
    const out = {};
    for (const [key, value] of Object.entries(headers)) {
      if (WebhookEvent.HEADER_DENY_RE.test(key)) continue;
      out[key] = Array.isArray(value) ? value.join(', ') : String(value);
    }
    return out;
  }

  static _attachRawForms(event, parsed) {
    if (parsed.bodyText != null) event.bodyText = parsed.bodyText;
    if (parsed.bodyBase64) {
      event.bodyBase64 = parsed.bodyBase64;
      event.bodyBytes = parsed.bodyBytes;
    }
  }
}

module.exports = WebhookEvent;
