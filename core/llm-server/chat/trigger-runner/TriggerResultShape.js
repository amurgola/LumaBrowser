const ExpectationMatcher = require('../../eval/ExpectationMatcher');

class TriggerResultShape {
  static FENCED_JSON = /```(?:json)?\s*([\s\S]*?)```/i;

  static resultJson(responseBody, finalResponse) {
    if (responseBody !== undefined) return TriggerResultShape._bodyJson(responseBody);
    let text = String(finalResponse || '').trim();
    const fence = text.match(TriggerResultShape.FENCED_JSON);
    if (fence) text = fence[1].trim();
    return TriggerResultShape._parse(text);
  }

  static error(expect, json) {
    if (!expect || typeof expect !== 'object') return null;
    if (json === undefined || json === null || typeof json !== 'object') return 'response is not a JSON object';
    const failed = Object.keys(expect).filter((key) => !ExpectationMatcher.matchParams({ [key]: expect[key] }, json));
    return failed.length ? `response shape mismatch on: ${failed.join(', ')}` : null;
  }

  static _bodyJson(body) {
    if (body && typeof body === 'object') return body;
    return TriggerResultShape._parse(String(body));
  }

  static _parse(text) {
    try {
      return JSON.parse(text);
    } catch (_) {
      return undefined;
    }
  }
}

module.exports = TriggerResultShape;
