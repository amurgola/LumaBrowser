class LlmTraceRecord {
  static MAX_TEXT_CHARS = 200 * 1024;
  static MAX_BODY_CHARS = 2 * 1024 * 1024;
  static MAX_DEPTH = 12;
  static BASE64_IMAGE_KEYS = ['base64', 'imageBase64'];

  static toLine(record) {
    const safe = { ...record };
    if (safe.requestBody !== undefined) safe.requestBody = LlmTraceRecord._boundedBody(safe.requestBody);
    if (safe.response) safe.response = LlmTraceRecord._cappedResponse(safe.response);
    return JSON.stringify(safe) + '\n';
  }

  static sanitizeBody(body) {
    return LlmTraceRecord._walk(body, 0, new WeakSet());
  }

  static cap(text, max) {
    if (text == null) return text;
    const str = String(text);
    return str.length > max ? `${str.slice(0, max)}... [${str.length - max} more chars]` : str;
  }

  static _boundedBody(body) {
    let json = JSON.stringify(LlmTraceRecord.sanitizeBody(body));
    if (json.length > LlmTraceRecord.MAX_BODY_CHARS) {
      json = JSON.stringify({ truncated: true, chars: json.length, preview: json.slice(0, LlmTraceRecord.MAX_BODY_CHARS) });
    }
    return JSON.parse(json);
  }

  static _cappedResponse(response) {
    return {
      ...response,
      text: LlmTraceRecord.cap(response.text, LlmTraceRecord.MAX_TEXT_CHARS),
      reasoning: LlmTraceRecord.cap(response.reasoning, LlmTraceRecord.MAX_TEXT_CHARS),
    };
  }

  static _walk(value, depth, seen) {
    if (value == null || typeof value !== 'object') {
      return typeof value === 'string' ? LlmTraceRecord.cap(value, LlmTraceRecord.MAX_TEXT_CHARS) : value;
    }
    if (seen.has(value) || depth > LlmTraceRecord.MAX_DEPTH) return '[circular]';
    seen.add(value);
    if (Array.isArray(value)) return value.map((item) => LlmTraceRecord._walk(item, depth + 1, seen));
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      const stub = LlmTraceRecord._imageStub(key, item);
      out[key] = stub !== null ? stub : LlmTraceRecord._walk(item, depth + 1, seen);
    }
    return out;
  }

  static _imageStub(key, value) {
    if (key === 'image_url' && value && typeof value === 'object' && typeof value.url === 'string') {
      return { url: `<image ${value.url.length} chars>` };
    }
    if (typeof value !== 'string') return null;
    if (LlmTraceRecord.BASE64_IMAGE_KEYS.includes(key) || value.startsWith('data:image')) return `<image ${value.length} chars>`;
    return null;
  }
}

module.exports = LlmTraceRecord;
