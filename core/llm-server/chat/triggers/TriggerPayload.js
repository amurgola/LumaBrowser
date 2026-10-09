class TriggerPayload {
  static CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
  static DEFAULT_MAX_CHARS = 64 * 1024;

  static sanitize(value) {
    if (typeof value === 'string') return value.replace(TriggerPayload.CONTROL_CHARS, '');
    if (Array.isArray(value)) return value.map(TriggerPayload.sanitize);
    if (value && typeof value === 'object') {
      const out = {};
      for (const [key, child] of Object.entries(value)) out[TriggerPayload.sanitize(key)] = TriggerPayload.sanitize(child);
      return out;
    }
    return value;
  }

  static eventJson(event, maxChars = TriggerPayload.DEFAULT_MAX_CHARS) {
    const json = TriggerPayload._prettyJson(event);
    if (json.length <= maxChars) return json;
    return `${json.slice(0, maxChars)}\n… [truncated: ${json.length - maxChars} more characters]`;
  }

  static buildUserMessage(prompt, event, { maxChars } = {}) {
    return [
      String(prompt || '').trim(),
      '',
      '<trigger_event>',
      '```json',
      TriggerPayload.eventJson(event, maxChars),
      '```',
      '</trigger_event>',
    ].join('\n');
  }

  static syntheticEvent(sample) {
    const event = { receivedAt: new Date().toISOString(), method: 'POST', synthetic: true, contentType: null, query: {}, headers: {}, body: null };
    if (typeof sample === 'string') TriggerPayload._applyTextSample(event, sample);
    else if (sample && typeof sample === 'object') Object.assign(event, { body: sample, contentType: 'application/json' });
    return TriggerPayload.sanitize(event);
  }

  static _applyTextSample(event, text) {
    try {
      event.body = JSON.parse(text);
      event.contentType = 'application/json';
    } catch (_) {
      event.bodyText = text;
      event.contentType = 'text/plain';
    }
  }

  static _prettyJson(event) {
    let json;
    try { json = JSON.stringify(TriggerPayload.sanitize(event), null, 2); } catch (_) { json = JSON.stringify(String(event)); }
    return json == null ? 'null' : json;
  }
}

module.exports = TriggerPayload;
