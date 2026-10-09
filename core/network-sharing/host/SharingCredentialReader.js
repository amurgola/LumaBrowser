class SharingCredentialReader {
  static COOKIE_NAME = 'luma_share_token';
  static BEARER_PATTERN = /^Bearer\s+(.+)$/i;
  static COOKIE_PATTERN = /(?:^|;\s*)luma_share_token=([^;]+)/;

  static bearer(req) {
    const auth = req.headers && req.headers.authorization;
    if (typeof auth !== 'string') return null;
    const match = SharingCredentialReader.BEARER_PATTERN.exec(auth.trim());
    return match ? match[1].trim() : null;
  }

  static browser(req) {
    return SharingCredentialReader.bearer(req) || SharingCredentialReader._query(req) || SharingCredentialReader._cookie(req);
  }

  static _query(req) {
    return req.query && req.query.token ? String(req.query.token) : null;
  }

  static _cookie(req) {
    const cookie = req.headers && req.headers.cookie;
    if (!cookie) return null;
    const match = SharingCredentialReader.COOKIE_PATTERN.exec(cookie);
    if (!match) return null;
    try {
      return decodeURIComponent(match[1]);
    } catch (_) {
      return match[1];
    }
  }
}

module.exports = SharingCredentialReader;
