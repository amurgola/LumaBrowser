class LivePageRequest {
  static MODES = ['markdown', 'text', 'html'];
  static DEFAULT_MAX_CHARS = 60000;
  static MIN_MAX_CHARS = 1000;
  static MAX_CHARS_CEILING = 200000;
  static MIN_TIMEOUT_MS = 3000;
  static MAX_TIMEOUT_MS = 60000;

  static validHttpUrl(url) {
    try {
      const parsed = new URL(String(url || ''));
      return (parsed.protocol === 'http:' || parsed.protocol === 'https:') ? parsed.href : null;
    } catch (_) {
      return null;
    }
  }

  static from(params = {}) {
    const url = LivePageRequest.validHttpUrl(params.url);
    if (!url) return null;
    return {
      url,
      mode: LivePageRequest.MODES.includes(params.mode) ? params.mode : 'markdown',
      maxChars: LivePageRequest.clampChars(params.maxChars),
      timeoutMs: LivePageRequest._clampTimeout(params.timeoutMs),
    };
  }

  static clampChars(n) {
    const value = Number(n);
    if (!Number.isFinite(value) || value <= 0) return LivePageRequest.DEFAULT_MAX_CHARS;
    return Math.min(Math.max(Math.floor(value), LivePageRequest.MIN_MAX_CHARS), LivePageRequest.MAX_CHARS_CEILING);
  }

  static _clampTimeout(timeoutMs) {
    if (!Number.isFinite(timeoutMs)) return undefined;
    return Math.min(Math.max(timeoutMs, LivePageRequest.MIN_TIMEOUT_MS), LivePageRequest.MAX_TIMEOUT_MS);
  }
}

module.exports = LivePageRequest;
