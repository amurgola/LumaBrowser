class SandboxPolicy {
  static MIN_TIMEOUT_MS = 5000;
  static MAX_TIMEOUT_MS = 30000;
  static DEFAULT_TIMEOUT_MS = 15000;
  static MAX_RESULT_BYTES = 256 * 1024;
  static MIN_SECRET_LENGTH = 4;

  static parseHttpUrl(url) {
    try {
      const parsed = new URL(String(url || ''));
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
      return parsed;
    } catch (_) {
      return null;
    }
  }

  static normalizeHostPattern(entry) {
    let text = String(entry || '').trim().toLowerCase();
    if (!text) return '';
    if (text.startsWith('*.')) text = text.slice(2);
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//.test(text) ? text : `https://${text}`;
    try {
      return new URL(withScheme).hostname;
    } catch (_) {
      return text.split('/')[0].split(':')[0];
    }
  }

  static hostAllowed(url, allowedHosts) {
    const parsed = SandboxPolicy.parseHttpUrl(url);
    if (!parsed) return false;
    const host = parsed.hostname.toLowerCase();
    return SandboxPolicy._patterns(allowedHosts).some((pattern) => host === pattern || host.endsWith(`.${pattern}`));
  }

  static clampTimeout(ms) {
    const value = Number(ms);
    if (!Number.isFinite(value) || value <= 0) return SandboxPolicy.DEFAULT_TIMEOUT_MS;
    return Math.min(Math.max(Math.floor(value), SandboxPolicy.MIN_TIMEOUT_MS), SandboxPolicy.MAX_TIMEOUT_MS);
  }

  static capText(text, maxBytes = SandboxPolicy.MAX_RESULT_BYTES) {
    const value = String(text == null ? '' : text);
    if (value.length <= maxBytes) return { text: value, truncated: false };
    return { text: value.slice(0, maxBytes), truncated: true };
  }

  static redactSecrets(text, secrets) {
    let value = String(text == null ? '' : text);
    for (const { key, value: secret } of (Array.isArray(secrets) ? secrets : [])) {
      const needle = String(secret == null ? '' : secret);
      if (needle.length < SandboxPolicy.MIN_SECRET_LENGTH) continue;
      value = value.split(needle).join(`[REDACTED:${key}]`);
    }
    return value;
  }

  static _patterns(allowedHosts) {
    return (Array.isArray(allowedHosts) ? allowedHosts : []).map(SandboxPolicy.normalizeHostPattern).filter(Boolean);
  }
}

module.exports = SandboxPolicy;
