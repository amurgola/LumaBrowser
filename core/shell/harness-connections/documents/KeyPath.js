const ConfigValue = require('./ConfigValue');

class KeyPath {
  static BARE_KEY = /^[A-Za-z0-9_-]+$/;

  static lookup(data, path) {
    let node = data;
    for (const key of path) {
      if (!ConfigValue.isTable(node) || !Object.prototype.hasOwnProperty.call(node, key)) return { present: false };
      node = node[key];
    }
    return { present: true, value: node };
  }

  static firstMissing(data, path) {
    for (let depth = 1; depth <= path.length; depth += 1) {
      const prefix = path.slice(0, depth);
      if (!KeyPath.lookup(data, prefix).present) return prefix;
    }
    return null;
  }

  static startsWith(path, prefix) {
    return prefix.length <= path.length && prefix.every((key, i) => path[i] === key);
  }

  static equals(a, b) {
    return a.length === b.length && KeyPath.startsWith(a, b);
  }

  static label(path) {
    return path.map((key) => (KeyPath.BARE_KEY.test(key) ? key : JSON.stringify(key))).join('.');
  }
}

module.exports = KeyPath;
