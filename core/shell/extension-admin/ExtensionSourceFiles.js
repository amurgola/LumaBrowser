const fs = require('fs');
const path = require('path');
const ContainedPath = require('../../shared/fs/ContainedPath');

class ExtensionSourceFiles {
  static ORDER = { 'manifest.js': 0, 'main.js': 1, 'renderer.js': 2, 'routes.js': 3, 'mcp-tools.js': 4 };

  static FORBIDDEN_NAME_CHARS = /[\\/:\0]/;

  static list(extDir) {
    try {
      return fs.readdirSync(extDir, { withFileTypes: true })
        .filter((e) => e.isFile() && !e.name.startsWith('.'))
        .map((e) => e.name)
        .sort(ExtensionSourceFiles._byEditingOrder);
    } catch (_) {
      return [];
    }
  }

  static read(extDir, fileName) {
    return fs.readFileSync(ExtensionSourceFiles.resolve(extDir, fileName), 'utf8');
  }

  static write(extDir, fileName, content) {
    fs.writeFileSync(ExtensionSourceFiles.resolve(extDir, fileName), String(content), 'utf8');
    return { success: true };
  }

  static resolve(extDir, fileName) {
    ExtensionSourceFiles._assertPlainName(fileName);
    const target = ContainedPath.resolveWithin(extDir, fileName, { label: 'extension folder' });
    if (!ContainedPath.isImmediateChild(extDir, target)) throw new Error(`Path "${fileName}" escapes the extension folder`);
    ExtensionSourceFiles._assertNoLinkEscape(extDir, target, fileName);
    return target;
  }

  static _assertPlainName(fileName) {
    if (typeof fileName !== 'string' || !fileName) throw new Error('A file path is required');
    if (ExtensionSourceFiles.FORBIDDEN_NAME_CHARS.test(fileName) || fileName === '.' || fileName === '..') {
      throw new Error(`Path "${fileName}" escapes the extension folder`);
    }
  }

  static _assertNoLinkEscape(extDir, target, fileName) {
    let real;
    try {
      real = fs.realpathSync(target);
    } catch (err) {
      if (err.code === 'ENOENT' && !ExtensionSourceFiles._isDanglingLink(target)) return;
      throw new Error(`Path "${fileName}" escapes the extension folder`);
    }
    if (!ContainedPath.isWithin(fs.realpathSync(extDir), real)) throw new Error(`Path "${fileName}" escapes the extension folder`);
  }

  static _isDanglingLink(target) {
    try {
      return fs.lstatSync(target).isSymbolicLink();
    } catch (_) {
      return false;
    }
  }

  static _byEditingOrder(a, b) {
    const rank = (name) => ExtensionSourceFiles.ORDER[name] ?? 99;
    return rank(a) - rank(b) || a.localeCompare(b);
  }
}

module.exports = ExtensionSourceFiles;
