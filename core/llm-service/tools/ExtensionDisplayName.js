const path = require('path');

class ExtensionDisplayName {
  static EXTENSIONS_DIR = path.join(__dirname, '..', '..', '..', 'extensions');
  static _cache = new Map();

  static forSource(source) {
    if (!source) return 'Extension tools';
    if (source.startsWith('ext.')) return ExtensionDisplayName.forExtension(source.slice(4));
    if (source.startsWith('core.')) return ExtensionDisplayName.titleCase(source.slice(5));
    return source;
  }

  static forExtension(id) {
    if (!ExtensionDisplayName._cache.has(id)) {
      ExtensionDisplayName._cache.set(id, ExtensionDisplayName._manifestName(id) || ExtensionDisplayName.titleCase(id));
    }
    return ExtensionDisplayName._cache.get(id);
  }

  static titleCase(id) {
    return String(id || '')
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  static _manifestName(id) {
    try {
      const manifest = require(path.join(ExtensionDisplayName.EXTENSIONS_DIR, id, 'manifest.js'));
      return manifest && typeof manifest.name === 'string' && manifest.name.trim() ? manifest.name.trim() : null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = ExtensionDisplayName;
