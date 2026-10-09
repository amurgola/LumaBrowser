const path = require('path');

class PathReferenceScanner {
  static DIRNAME_JOIN = /path\.(?:join|resolve)\(\s*__dirname\s*((?:,\s*(['"])[^'"\n]*\2\s*)+)\)/g;
  static SEGMENT = /(['"])([^'"\n]*)\1/g;
  static BARE_FILE = /(['"`])([\w.-]+\.js)\1/g;
  static ROOT_PATH = /(['"`])([\w-]+(?:\/[\w.-]+)+\.js)\1/g;
  static REQUIRE_BEFORE = /require\s*\(\s*$/;
  static SPAWN_SIGNAL = /\bnew\s+Worker\b|\butilityProcess\b|\bfork\s*\(|\bworkerPath\b|\bWORKER_(?:PATH|FILE)\b/;
  static PRELOAD_NAME = /(^|[-.])preload\.js$/i;

  static references(tree, rel) {
    const source = tree.read(rel);
    const targets = new Set([
      ...PathReferenceScanner._dirnameJoins(tree, rel, source),
      ...PathReferenceScanner._bareSiblings(tree, rel, source),
      ...PathReferenceScanner._rootPaths(tree, source),
    ]);
    targets.delete(rel);
    const spawns = PathReferenceScanner.SPAWN_SIGNAL.test(source);
    return [...targets].map((target) => ({ target, referrer: rel, kind: PathReferenceScanner._kind(target, spawns) }));
  }

  static _dirnameJoins(tree, rel, source) {
    const out = [];
    const re = new RegExp(PathReferenceScanner.DIRNAME_JOIN.source, 'g');
    let match;
    while ((match = re.exec(source)) !== null) {
      const target = PathReferenceScanner._joinFromDir(rel, PathReferenceScanner._segments(match[1]));
      if (target.endsWith('.js') && tree.has(target)) out.push(target);
    }
    return out;
  }

  static _segments(argText) {
    const out = [];
    const re = new RegExp(PathReferenceScanner.SEGMENT.source, 'g');
    let match;
    while ((match = re.exec(argText)) !== null) out.push(match[2]);
    return out;
  }

  static _joinFromDir(rel, segments) {
    return path.posix.normalize(path.posix.join(path.posix.dirname(rel), ...segments));
  }

  static _bareSiblings(tree, rel, source) {
    return PathReferenceScanner._literals(PathReferenceScanner.BARE_FILE, source)
      .map((name) => PathReferenceScanner._joinFromDir(rel, [name]))
      .filter((target) => tree.has(target));
  }

  static _rootPaths(tree, source) {
    return PathReferenceScanner._literals(PathReferenceScanner.ROOT_PATH, source).filter((target) => tree.has(target));
  }

  static _literals(pattern, source) {
    const out = [];
    const re = new RegExp(pattern.source, 'g');
    let match;
    while ((match = re.exec(source)) !== null) {
      if (PathReferenceScanner.REQUIRE_BEFORE.test(source.slice(Math.max(0, match.index - 20), match.index))) continue;
      out.push(match[2]);
    }
    return out;
  }

  static _kind(target, referrerSpawns) {
    if (PathReferenceScanner.PRELOAD_NAME.test(path.posix.basename(target))) return 'preload';
    return referrerSpawns ? 'worker' : 'path-loaded';
  }
}

module.exports = PathReferenceScanner;
