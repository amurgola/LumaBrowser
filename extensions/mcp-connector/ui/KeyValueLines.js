export default class KeyValueLines {
  static parse(text) {
    const out = {};
    String(text || '').split(/\r?\n/).forEach((line) => {
      const i = line.indexOf('=');
      if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    });
    return out;
  }

  static format(obj) {
    return Object.entries(obj || {}).map(([k, v]) => k + '=' + v).join('\n');
  }
}
