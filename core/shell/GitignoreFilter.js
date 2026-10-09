const fs = require('fs');
const path = require('path');
const GlobPattern = require('./GlobPattern');

class GitignoreFilter {
  constructor(rules) {
    this._rules = rules || [];
  }

  get empty() {
    return this._rules.length === 0;
  }

  ignores(relPath, isDir) {
    const target = GitignoreFilter._toPosixRelative(relPath);
    if (!target) return false;
    let ignored = false;
    for (const rule of this._rules) {
      if (rule.dirOnly && !isDir) continue;
      if (rule.re.test(target)) ignored = !rule.negated;
    }
    return ignored;
  }

  static forRoot(rootDir, fsOps = fs) {
    try {
      return GitignoreFilter.parse(fsOps.readFileSync(path.join(rootDir, '.gitignore'), 'utf8'));
    } catch (_) {
      return new GitignoreFilter([]);
    }
  }

  static parse(text) {
    const rules = String(text || '').split(/\r?\n/)
      .map(GitignoreFilter._parseLine)
      .filter(Boolean);
    return new GitignoreFilter(rules);
  }

  static _parseLine(raw) {
    let line = raw.trim();
    if (!line || line.startsWith('#')) return null;
    const negated = line.startsWith('!');
    if (negated) line = line.slice(1);
    const dirOnly = line.endsWith('/');
    if (dirOnly) line = line.slice(0, -1);
    const anchored = GitignoreFilter._isAnchored(line);
    if (line.startsWith('/')) line = line.slice(1);
    if (!line) return null;
    return GitignoreFilter._toRule(line, { negated, dirOnly, anchored });
  }

  static _isAnchored(line) {
    return line.startsWith('/') || line.slice(0, -1).includes('/');
  }

  static _toRule(body, { negated, dirOnly, anchored }) {
    try {
      return { negated, dirOnly, re: GitignoreFilter._toRegExp(body, anchored) };
    } catch (_) {
      return null;
    }
  }

  static _toRegExp(body, anchored) {
    const source = GlobPattern.toSource(body);
    return new RegExp(anchored ? `^${source}$` : `^(?:.*/)?${source}$`);
  }

  static _toPosixRelative(relPath) {
    return String(relPath || '').replace(/\\/g, '/').replace(/^\.\//, '');
  }
}

module.exports = GitignoreFilter;
