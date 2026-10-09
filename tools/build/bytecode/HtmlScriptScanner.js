const path = require('path');

class HtmlScriptScanner {
  static SCRIPT_SRC = /<script\b[^>]*\bsrc\s*=\s*(['"])([^'"]+)\1/gi;
  static URL_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

  static scripts(html, htmlAbsPath, rootDir) {
    const out = [];
    for (const src of HtmlScriptScanner._sources(html)) {
      const rel = HtmlScriptScanner._toRootRelative(src, htmlAbsPath, rootDir);
      if (rel) out.push(rel);
    }
    return out;
  }

  static _sources(html) {
    const out = [];
    const re = new RegExp(HtmlScriptScanner.SCRIPT_SRC.source, 'gi');
    let match;
    while ((match = re.exec(String(html || ''))) !== null) out.push(match[2].trim());
    return out;
  }

  static _toRootRelative(src, htmlAbsPath, rootDir) {
    if (!src.toLowerCase().endsWith('.js')) return null;
    if (HtmlScriptScanner.URL_SCHEME.test(src) || src.startsWith('/')) return null;
    const resolved = path.resolve(path.dirname(htmlAbsPath), src);
    const rel = path.relative(rootDir, resolved).split(path.sep).join('/');
    return rel.startsWith('..') ? null : rel;
  }
}

module.exports = HtmlScriptScanner;
