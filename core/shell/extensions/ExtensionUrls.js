const path = require('path');

class ExtensionUrls {
  static UI_PREFIX = '/llm-ui/ext';

  static uiAsset(extensionId, relPath) {
    return `${ExtensionUrls.UI_PREFIX}/${extensionId}/${path.basename(relPath)}`;
  }

  static uiFile(extensionId, relPath) {
    const parts = String(relPath || '').replace(/\\/g, '/').split('/').filter((p) => p && p !== '.');
    if (!parts.length || parts.some((p) => p === '..')) return null;
    return `${ExtensionUrls.UI_PREFIX}/${extensionId}/${parts.join('/')}`;
  }
}

module.exports = ExtensionUrls;
