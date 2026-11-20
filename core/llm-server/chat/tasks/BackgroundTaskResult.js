class BackgroundTaskResult {
  static MAX_CHARS = 6000;
  static HEAD_CHARS = 1500;
  static DROPPED_KEYS = ['success', 'imageBase64', 'mimeType', 'artifact', 'summary', 'toolCatalogChanged'];

  static succeeded(result) {
    return !(result && typeof result === 'object' && result.success === false);
  }

  static text(result) {
    return BackgroundTaskResult.clip(BackgroundTaskResult._body(result));
  }

  static clip(text) {
    const whole = String(text || '').trim();
    if (whole.length <= BackgroundTaskResult.MAX_CHARS) return whole;
    const tailChars = BackgroundTaskResult.MAX_CHARS - BackgroundTaskResult.HEAD_CHARS;
    const leftOut = whole.length - BackgroundTaskResult.MAX_CHARS;
    return `${whole.slice(0, BackgroundTaskResult.HEAD_CHARS)}\n[... ${leftOut} characters left out ...]\n${whole.slice(whole.length - tailChars)}`;
  }

  static _body(result) {
    if (result == null) return '';
    if (typeof result !== 'object') return String(result);
    if (result.success === false && typeof result.error === 'string' && result.error) return result.error;
    if (typeof result.message === 'string' && result.message) return result.message;
    if (typeof result.data === 'string') return result.data;
    return BackgroundTaskResult._json(result.data !== undefined ? result.data : BackgroundTaskResult._withoutBulk(result));
  }

  static _withoutBulk(result) {
    const kept = {};
    for (const [key, value] of Object.entries(result)) {
      if (!BackgroundTaskResult.DROPPED_KEYS.includes(key)) kept[key] = value;
    }
    return kept;
  }

  static _json(value) {
    if (value == null || (typeof value === 'object' && !Object.keys(value).length)) return '';
    try { return JSON.stringify(value, null, 2); } catch (_) { return String(value); }
  }
}

module.exports = BackgroundTaskResult;
