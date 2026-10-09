const fs = require('fs');
const path = require('path');

class RipgrepBinary {
  static _cached;

  static path() {
    if (RipgrepBinary._cached === undefined) RipgrepBinary._cached = RipgrepBinary._resolve();
    return RipgrepBinary._cached;
  }

  static available() {
    return !!RipgrepBinary.path();
  }

  static reset() {
    RipgrepBinary._cached = undefined;
  }

  static _resolve() {
    const binary = process.platform === 'win32' ? 'rg.exe' : 'rg';
    try {
      const resolved = require.resolve(`@vscode/ripgrep-${process.platform}-${process.arch}/bin/${binary}`);
      return RipgrepBinary._preferUnpacked(resolved);
    } catch (_) {
      return null;
    }
  }

  static _preferUnpacked(resolved) {
    const unpacked = resolved.replace(`${path.sep}app.asar${path.sep}`, `${path.sep}app.asar.unpacked${path.sep}`);
    return unpacked !== resolved && fs.existsSync(unpacked) ? unpacked : resolved;
  }
}

module.exports = RipgrepBinary;
