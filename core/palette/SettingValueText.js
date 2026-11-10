class SettingValueText {
  static MAX = 32;

  static text(spec, raw, names = {}) {
    if (!spec) return null;
    const unset = raw === null || raw === undefined || raw === '';
    if (unset && spec.unsetText) return spec.unsetText;
    const value = unset ? spec.default : raw;
    if (value === undefined || (value === null && spec.format !== 'onoff')) return null;
    const fn = SettingValueText.FORMATS[spec.format] || SettingValueText.FORMATS.text;
    const out = fn(value, spec, names);
    return out == null || out === '' ? null : SettingValueText.clip(String(out));
  }

  static clip(s) {
    return s.length > SettingValueText.MAX ? s.slice(0, SettingValueText.MAX - 1) + '…' : s;
  }

  static truthy(v) {
    return v === true || v === 'true' || v === 1 || v === '1';
  }

  static FORMATS = {
    onoff: (v, spec) => ((SettingValueText.truthy(v) !== !!spec.invert) ? 'On' : 'Off'),
    labels: (v, spec) => (spec.labels && Object.prototype.hasOwnProperty.call(spec.labels, String(v)) ? spec.labels[String(v)] : String(v)),
    count: (v) => (Number.isFinite(Number(v)) ? String(Math.floor(Number(v))) : null),
    tokens: (v) => SettingValueText.tokens(Number(v)),
    gib: (v) => {
      const n = Number(v);
      if (!Number.isFinite(n) || n <= 0) return null;
      const gb = n / (1024 * 1024 * 1024);
      return (Number.isInteger(gb) ? gb : gb.toFixed(1)) + ' GB';
    },
    duration: (v) => SettingValueText.duration(Number(v)),
    file: (v) => SettingValueText.fileName(v),
    path: (v) => SettingValueText.pathTail(v),
    runtime: (v, _spec, names) => (typeof names.runtime === 'function' && names.runtime(String(v))) || String(v),
    text: (v) => (typeof v === 'object' ? null : String(v)),
  };

  static tokens(n) {
    if (!Number.isFinite(n) || n <= 0) return null;
    if (n >= 1024 * 1024 && n % (1024 * 1024) === 0) return (n / (1024 * 1024)) + 'M';
    if (n >= 1024) return Math.round(n / 1024) + 'k';
    return String(n);
  }

  static duration(ms) {
    if (!Number.isFinite(ms) || ms <= 0) return 'Off';
    const min = Math.round(ms / 60000);
    if (min < 1) return Math.round(ms / 1000) + ' s';
    if (min < 60 || min % 60 !== 0) return min + ' min';
    return (min / 60) + ' h';
  }

  static fileName(p) {
    const base = String(p).split(/[\\/]/).filter(Boolean).pop() || '';
    return base.replace(/\.(gguf|safetensors|bin)$/i, '');
  }

  static pathTail(p) {
    const s = String(p);
    const parts = s.split(/[\\/]+/).filter(Boolean);
    return parts.slice(-2).join(s.includes('\\') ? '\\' : '/');
  }
}

module.exports = SettingValueText;
