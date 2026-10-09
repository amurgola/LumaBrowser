const BuildFs = require('../BuildFs');
const path = require('path');

const fs = BuildFs.get();

class UnpackedSnapshot {
  static patterns(unpackedDir) {
    const out = new Set();
    for (const rel of UnpackedSnapshot._files(unpackedDir, unpackedDir, [])) out.add(UnpackedSnapshot._patternFor(rel));
    return [...out];
  }

  static _patternFor(rel) {
    const parts = rel.split('/');
    if (parts[0] !== 'node_modules' || parts.length < 3) return rel;
    const depth = parts[1].startsWith('@') ? 3 : 2;
    return parts.length > depth ? `${parts.slice(0, depth).join('/')}/**` : rel;
  }

  static _files(dir, root, out) {
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return out; }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) UnpackedSnapshot._files(full, root, out);
      else out.push(path.relative(root, full).split(path.sep).join('/'));
    }
    return out;
  }
}

module.exports = UnpackedSnapshot;
