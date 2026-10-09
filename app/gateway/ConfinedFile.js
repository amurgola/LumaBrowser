const path = require('path');

class ConfinedFile {
  static resolve(rootDir, reqPath, prefixRe, { fallback = null } = {}) {
    let rel;
    try {
      rel = decodeURIComponent(String(reqPath).replace(prefixRe, '')) || fallback;
    } catch (_) {
      return { status: 400 };
    }
    if (!rel || rel.includes('\0')) return { status: 400 };
    const resolved = path.resolve(rootDir, rel);
    if (!ConfinedFile.isInside(rootDir, resolved)) return { status: 403 };
    return { path: resolved };
  }

  static isInside(rootDir, resolved) {
    return (resolved + path.sep).startsWith(rootDir + path.sep);
  }

  static handler(rootDir, prefixRe, options = {}) {
    return (req, res) => {
      const target = ConfinedFile.resolve(rootDir, req.path, prefixRe, options);
      if (target.status) return res.status(target.status).end();
      return ConfinedFile.send(res, rootDir, target.path);
    };
  }

  static send(res, rootDir, absolutePath) {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.relative(rootDir, absolutePath), { root: rootDir, etag: false, lastModified: false, cacheControl: false }, (err) => {
      if (err && !res.headersSent) res.status(err.status || 404).end();
    });
  }
}

module.exports = ConfinedFile;
