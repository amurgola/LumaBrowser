const fs = require('fs');
const path = require('path');
const PhaserLint = require('../../lint/PhaserLint');

class WriteNotes {
  static phaserApi(dir, relPath, content) {
    const rel = WriteNotes._normalize(relPath);
    if (!/\.(js|html?)$/i.test(rel)) return '';
    const text = content == null ? WriteNotes._read(path.join(dir, rel)) : content;
    if (text == null) return '';
    const findings = PhaserLint.lint(text);
    return findings.length ? `\n${PhaserLint.formatFindings(findings)}` : '';
  }

  static indexWiring(dir, relPath) {
    const rel = WriteNotes._normalize(relPath);
    if (!/^src\//.test(rel)) return '';
    const index = WriteNotes._read(path.join(dir, 'index.html'));
    if (index == null || index.includes(rel)) return '';
    return `\nNOTE: index.html does NOT reference ${rel} yet, so the game cannot load it. `
      + `Add <script src="${rel}"></script> to index.html in dependency order before you finish.`;
  }

  static _normalize(relPath) {
    return String(relPath || '').replace(/\\/g, '/');
  }

  static _read(file) {
    try { return fs.readFileSync(file, 'utf8'); } catch (_) { return null; }
  }
}

module.exports = WriteNotes;
