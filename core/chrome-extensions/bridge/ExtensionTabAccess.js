const MatchPattern = require('./MatchPattern');

class ExtensionTabAccess {
  static TABS_PERMISSION = 'tabs';

  static canRead(sess, extId, url) {
    const manifest = ExtensionTabAccess._manifestOf(sess, extId);
    if (!manifest) return false;
    const permissions = Array.isArray(manifest.permissions) ? manifest.permissions : [];
    if (permissions.includes(ExtensionTabAccess.TABS_PERMISSION)) return true;
    return ExtensionTabAccess.hostPatterns(manifest).some((pattern) => MatchPattern.matches(pattern, url));
  }

  static hostPatterns(manifest) {
    const listed = [].concat(manifest.host_permissions || [], manifest.permissions || []);
    return listed.filter((entry) => typeof entry === 'string' && (entry === MatchPattern.ALL_URLS || entry.includes('://')));
  }

  static _manifestOf(sess, extId) {
    try {
      const extensions = sess && (sess.extensions || sess);
      const extension = extensions && typeof extensions.getExtension === 'function' ? extensions.getExtension(extId) : null;
      return (extension && extension.manifest) || null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = ExtensionTabAccess;
