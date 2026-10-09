class ResponseFormat {
  static FENCED_JSON = /^```(?:json)?\s*([\s\S]*?)\s*```$/;

  static instructionFor(responsePrompt) {
    if (!responsePrompt || !responsePrompt.trim()) return null;
    return `FINAL OUTPUT FORMAT (STRICT):
Your final message (the one without a tool call) MUST be exactly one JSON object matching this schema, with every value replaced by what you extracted from the page. No prose, no explanation, no markdown code fences. Just the raw JSON object.

Schema:
${responsePrompt.trim()}`;
  }

  static parseJson(text) {
    if (typeof text !== 'string') return undefined;
    const body = ResponseFormat._unfenced(text.trim());
    if (!body || (body[0] !== '{' && body[0] !== '[')) return undefined;
    try {
      return JSON.parse(body);
    } catch (_) {
      return undefined;
    }
  }

  static _unfenced(text) {
    const fenced = text.match(ResponseFormat.FENCED_JSON);
    return fenced ? fenced[1].trim() : text;
  }
}

module.exports = ResponseFormat;
