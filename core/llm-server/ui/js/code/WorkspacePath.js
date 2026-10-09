export default class WorkspacePath {
  static parentOf(path) {
    const i = String(path || '').lastIndexOf('/');
    return i === -1 ? '' : path.slice(0, i);
  }

  static baseName(path) {
    return String(path).split('/').pop();
  }

  static join(dir, name) {
    return (dir ? dir + '/' : '') + String(name).replace(/^\/+/, '');
  }

  static relativeTo(root, path) {
    let rel = String(path || '').replace(/\\/g, '/').trim();
    if (!rel) return null;
    const base = WorkspacePath.normalizedRoot(root);
    if (/^([a-zA-Z]:\/|\/)/.test(rel)) {
      if (!base || rel.toLowerCase().indexOf(base.toLowerCase() + '/') !== 0) return null;
      rel = rel.slice(base.length + 1);
    }
    rel = rel.replace(/^\.\//, '').replace(/^\/+/, '');
    return !rel || rel.split('/').includes('..') ? null : rel;
  }

  static normalizedRoot(root) {
    return String(root || '').replace(/\\/g, '/').replace(/\/+$/, '');
  }

  static isWithin(path, dir) {
    return path === dir || path.startsWith(dir + '/');
  }
}
