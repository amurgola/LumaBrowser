class IniFile {
  static parse(text) {
    const values = {};
    for (const line of String(text || '').split(/\r?\n/)) {
      const at = line.indexOf('=');
      if (at <= 0 || line.trimStart().startsWith('#')) continue;
      values[line.slice(0, at).trim()] = line.slice(at + 1).trim();
    }
    return values;
  }

  static format(values) {
    return `${Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n')}\n`;
  }
}

module.exports = IniFile;
