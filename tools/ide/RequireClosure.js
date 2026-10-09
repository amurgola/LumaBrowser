const fs = require('fs');
const path = require('path');

class RequireClosure {
  static RELATIVE_REQUIRE_RE = /require\(\s*'(\.{1,2}\/[^']+)'\s*\)/g;

  static collect(entries) {
    const seen = new Set();
    const queue = [...entries];
    while (queue.length) {
      const file = queue.shift();
      if (seen.has(file)) continue;
      seen.add(file);
      queue.push(...RequireClosure.relativeRequires(file));
    }
    return [...seen];
  }

  static relativeRequires(file) {
    const source = fs.readFileSync(file, 'utf8');
    return [...source.matchAll(RequireClosure.RELATIVE_REQUIRE_RE)].map((m) => RequireClosure._resolve(path.dirname(file), m[1], file));
  }

  static _resolve(dir, spec, from) {
    const base = path.resolve(dir, spec);
    const hit = [base, `${base}.js`, path.join(base, 'index.js')].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
    if (!hit) throw new Error(`RequireClosure: ${from} requires ${spec}, which does not exist`);
    return hit;
  }
}

module.exports = RequireClosure;
