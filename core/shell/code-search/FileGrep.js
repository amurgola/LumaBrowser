const fsp = require('fs').promises;

class FileGrep {
  static MAX_FILE_BYTES = 2 * 1024 * 1024;
  static NUL = String.fromCharCode(0);

  static async search(abs, rel, regex, limit, matches) {
    const text = await FileGrep._readText(abs);
    if (text == null) return false;
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (!regex.test(lines[i])) continue;
      matches.push({ file: rel, line: i + 1, text: lines[i] });
      if (matches.length >= limit) return true;
    }
    return false;
  }

  static async _readText(abs) {
    try {
      if (await FileGrep.sizeOf(abs) > FileGrep.MAX_FILE_BYTES) return null;
      const text = await fsp.readFile(abs, 'utf8');
      return text.includes(FileGrep.NUL) ? null : text;
    } catch (_) {
      return null;
    }
  }

  static async sizeOf(abs) {
    try {
      return (await fsp.stat(abs)).size;
    } catch (_) {
      return 0;
    }
  }
}

module.exports = FileGrep;
