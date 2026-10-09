const path = require('path');

class RequireScanner {
  static RELATIVE_REQUIRE = /\brequire\s*\(\s*(['"`])(\.{1,2}\/[^'"`]+)\1\s*\)/g;

  static requiredFiles(tree, rel) {
    const out = [];
    for (const spec of RequireScanner.specifiers(tree.read(rel))) {
      const target = RequireScanner.resolve(tree, rel, spec);
      if (target) out.push(target);
    }
    return out;
  }

  static specifiers(source) {
    const out = [];
    const re = new RegExp(RequireScanner.RELATIVE_REQUIRE.source, 'g');
    let match;
    while ((match = re.exec(String(source || ''))) !== null) out.push(match[2]);
    return out;
  }

  static resolve(tree, fromRel, spec) {
    const base = path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), spec));
    for (const candidate of [base, `${base}.js`, `${base}/index.js`]) {
      if (tree.has(candidate)) return candidate;
    }
    return null;
  }

  static closure(tree, roots) {
    const seen = new Set();
    const stack = [...roots];
    while (stack.length) {
      const rel = stack.pop();
      if (seen.has(rel)) continue;
      seen.add(rel);
      if (rel.endsWith('.js')) stack.push(...RequireScanner.requiredFiles(tree, rel));
    }
    return seen;
  }
}

module.exports = RequireScanner;
