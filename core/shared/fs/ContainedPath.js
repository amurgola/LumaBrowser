const path = require('path');

class ContainedPath {
  static isWithin(root, candidate) {
    if (!ContainedPath._isNonEmptyString(root) || !ContainedPath._isNonEmptyString(candidate)) return false;
    const relative = path.relative(path.resolve(root), path.resolve(candidate));
    return ContainedPath._isStrictlyBelow(relative);
  }

  static resolveWithin(root, relPath, { label = 'workspace' } = {}) {
    ContainedPath._assertRelativePath(relPath);
    const target = path.resolve(root, relPath);
    if (!ContainedPath.isWithin(root, target)) {
      throw new Error(`Path "${relPath}" escapes the ${label}`);
    }
    return target;
  }

  static isImmediateChild(root, candidate) {
    if (!ContainedPath.isWithin(root, candidate)) return false;
    return path.dirname(path.resolve(candidate)) === path.resolve(root);
  }

  static _isNonEmptyString(value) {
    return typeof value === 'string' && value.length > 0;
  }

  static _isStrictlyBelow(relative) {
    return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
  }

  static _assertRelativePath(relPath) {
    if (!ContainedPath._isNonEmptyString(relPath)) throw new Error('A file path is required');
    if (path.isAbsolute(relPath)) throw new Error(`Path must be relative, got "${relPath}"`);
  }
}

module.exports = ContainedPath;
