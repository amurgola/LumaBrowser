const fs = require('fs');
const path = require('path');

class BinaryLookup {
  static DEFAULT_MAX_DEPTH = 3;

  static async pathExists(target) {
    try {
      await fs.promises.access(target, fs.constants.F_OK);
      return true;
    } catch (_) {
      return false;
    }
  }

  static async findBinaryIn(dir, names, { maxDepth = BinaryLookup.DEFAULT_MAX_DEPTH } = {}) {
    if (!(await BinaryLookup._isSearchable(dir, names))) return null;
    return BinaryLookup._breadthFirstSearch(dir, names, maxDepth);
  }

  static async _isSearchable(dir, names) {
    if (!dir || !Array.isArray(names) || names.length === 0) return false;
    return BinaryLookup.pathExists(dir);
  }

  static async _breadthFirstSearch(root, names, maxDepth) {
    const queue = [{ dir: root, depth: 0 }];
    const seen = new Set();
    while (queue.length > 0) {
      const { dir, depth } = queue.shift();
      if (seen.has(dir)) continue;
      seen.add(dir);

      const hit = await BinaryLookup._firstCandidateIn(dir, names);
      if (hit) return hit;
      if (depth < maxDepth) {
        const children = await BinaryLookup._childDirectories(dir);
        for (const child of children) queue.push({ dir: child, depth: depth + 1 });
      }
    }
    return null;
  }

  static async _firstCandidateIn(dir, names) {
    for (const name of names) {
      const candidate = path.join(dir, name);
      if (await BinaryLookup.pathExists(candidate)) return candidate;
    }
    return null;
  }

  static async _childDirectories(dir) {
    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      return entries.filter((e) => e.isDirectory()).map((e) => path.join(dir, e.name));
    } catch (_) {
      return [];
    }
  }
}

module.exports = BinaryLookup;
