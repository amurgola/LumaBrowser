class WindhawkModSource {
  static START = '// ==WindhawkMod==';
  static END = '// ==/WindhawkMod==';
  static SETTINGS_START = '// ==WindhawkModSettings==';
  static SETTINGS_END = '// ==/WindhawkModSettings==';
  static CLIENT_BEGIN = '// BEGIN luma_client';
  static CLIENT_END = '// END luma_client';
  static TARGETS = { 'x86': 'i686-w64-mingw32', 'x86-64': 'x86_64-w64-mingw32', 'amd64': 'x86_64-w64-mingw32', 'arm64': 'aarch64-w64-mingw32' };
  static DEFAULT_ARCHITECTURES = ['x86', 'x86-64'];

  static parse(source) {
    const text = WindhawkModSource._text(source);
    const start = text.indexOf(WindhawkModSource.START);
    const end = text.indexOf(WindhawkModSource.END);
    if (start < 0 || end < start) throw new Error('No // ==WindhawkMod== header block');
    const fields = {};
    for (const line of text.slice(start + WindhawkModSource.START.length, end).split('\n')) {
      const match = /^\s*\/\/\s*@([\w:-]+)\s*(.*?)\s*$/.exec(line);
      if (!match) continue;
      (fields[match[1]] = fields[match[1]] || []).push(match[2]);
    }
    const one = (name) => (fields[name] ? fields[name][fields[name].length - 1] : '');
    const architectures = (fields.architecture || []).map((a) => a.trim().toLowerCase()).filter(Boolean);
    return {
      fields,
      id: one('id'),
      name: one('name'),
      description: one('description'),
      version: one('version'),
      include: fields.include || [],
      exclude: fields.exclude || [],
      architectureField: architectures,
      architectures: architectures.length ? architectures : WindhawkModSource.DEFAULT_ARCHITECTURES.slice(),
      targets: WindhawkModSource.targets(architectures),
      compilerOptions: WindhawkModSource.splitArgs((fields.compilerOptions || []).join(' ')),
    };
  }

  static targets(architectures) {
    const list = architectures && architectures.length ? architectures : WindhawkModSource.DEFAULT_ARCHITECTURES;
    const out = [];
    for (const arch of list) {
      const target = WindhawkModSource.TARGETS[arch];
      if (!target) throw new Error(`Unsupported @architecture "${arch}"`);
      if (!out.includes(target)) out.push(target);
    }
    return out;
  }

  static splitArgs(line) {
    const out = [];
    const re = /"([^"]*)"|(\S+)/g;
    let match;
    while ((match = re.exec(String(line || '')))) out.push(match[1] !== undefined ? match[1] : match[2]);
    return out;
  }

  static clientBlock(source) {
    const text = WindhawkModSource._text(source);
    const begin = text.indexOf(WindhawkModSource.CLIENT_BEGIN);
    if (begin < 0) return null;
    const endAt = text.indexOf(WindhawkModSource.CLIENT_END, begin);
    if (endAt < 0) return null;
    return text.slice(begin, endAt + WindhawkModSource.CLIENT_END.length);
  }

  static initialSettings(source) {
    const block = WindhawkModSource._settingsBlock(source);
    if (block === null) return {};
    const out = {};
    for (const line of block.split('\n')) {
      if (!line.trim() || /^\s*#/.test(line)) continue;
      const item = /^- ([A-Za-z_][\w.-]*):\s*(.*?)\s*$/.exec(line);
      if (!item) continue;
      const [, key, raw] = item;
      if (raw === '' || raw === '>-' || raw === '|') throw new Error(`Setting "${key}" has a nested or block value, which this installer does not support`);
      WindhawkModSource._assign(out, key, WindhawkModSource._value(raw, key));
    }
    return out;
  }

  static _assign(out, key, value) {
    if (Array.isArray(value)) value.forEach((v, i) => { out[`${key}[${i}]`] = WindhawkModSource._engineScalar(v); });
    else out[key] = WindhawkModSource._engineScalar(value);
  }

  static _engineScalar(v) {
    return typeof v === 'boolean' ? (v ? 1 : 0) : v;
  }

  static _value(raw, key) {
    if (raw.startsWith('[')) {
      if (!raw.endsWith(']')) throw new Error(`Setting "${key}" has an unterminated list`);
      const inner = raw.slice(1, -1).trim();
      if (!inner) return [];
      return WindhawkModSource._splitFlow(inner).map((part) => WindhawkModSource._scalar(part.trim(), key));
    }
    if (raw.startsWith('{')) throw new Error(`Setting "${key}" is an object, which this installer does not support`);
    return WindhawkModSource._scalar(raw, key);
  }

  static _splitFlow(inner) {
    const parts = [];
    let current = '';
    let quote = null;
    for (const ch of inner) {
      if (quote) {
        current += ch;
        if (ch === quote) quote = null;
      } else if (ch === '"' || ch === "'") {
        quote = ch;
        current += ch;
      } else if (ch === ',') {
        parts.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    parts.push(current);
    return parts;
  }

  static _scalar(raw, key) {
    if (raw.startsWith('"')) {
      if (!raw.endsWith('"') || raw.length < 2) throw new Error(`Setting "${key}" has an unterminated string`);
      return JSON.parse(raw);
    }
    if (raw.startsWith("'")) {
      if (!raw.endsWith("'") || raw.length < 2) throw new Error(`Setting "${key}" has an unterminated string`);
      return raw.slice(1, -1).replace(/''/g, "'");
    }
    const plain = raw.replace(/\s+#.*$/, '');
    if (plain === 'true') return true;
    if (plain === 'false') return false;
    if (/^-?\d+$/.test(plain)) return parseInt(plain, 10);
    return plain;
  }

  static _settingsBlock(source) {
    const text = WindhawkModSource._text(source);
    const start = text.indexOf(WindhawkModSource.SETTINGS_START);
    if (start < 0) return null;
    const end = text.indexOf(WindhawkModSource.SETTINGS_END, start);
    if (end < 0) throw new Error('Unterminated // ==WindhawkModSettings== block');
    const body = text.slice(start + WindhawkModSource.SETTINGS_START.length, end);
    const open = body.indexOf('/*');
    const close = body.lastIndexOf('*/');
    return open >= 0 && close > open ? body.slice(open + 2, close) : '';
  }

  static _text(source) {
    return String(source).replace(/\r\n/g, '\n');
  }
}

module.exports = WindhawkModSource;
