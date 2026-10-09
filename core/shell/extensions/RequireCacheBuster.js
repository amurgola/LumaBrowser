const path = require('path');

class RequireCacheBuster {
  static bust(dir, cache = require.cache) {
    const prefix = path.resolve(dir) + path.sep;
    let removed = 0;
    for (const key of Object.keys(cache)) {
      if (!key.startsWith(prefix)) continue;
      try {
        delete cache[key];
        removed += 1;
      } catch (_) {}
    }
    return removed;
  }
}

module.exports = RequireCacheBuster;
