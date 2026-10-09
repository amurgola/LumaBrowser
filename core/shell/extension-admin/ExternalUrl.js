class ExternalUrl {
  static ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:'];

  static refusal(url) {
    if (typeof url !== 'string') return 'url must be a string';
    let parsed;
    try { parsed = new URL(url); } catch (_) { return 'invalid URL'; }
    if (!ExternalUrl.ALLOWED_PROTOCOLS.includes(parsed.protocol)) return `protocol ${parsed.protocol} not allowed`;
    return null;
  }
}

module.exports = ExternalUrl;
