const ColorDepth = require('./ColorDepth');

class ColorScheme {
  static fromColorFgBg(value) {
    if (!value) return null;
    const parts = String(value).split(';').map((s) => parseInt(s, 10)).filter((n) => Number.isInteger(n) && n >= 0 && n <= 255);
    if (!parts.length) return null;
    const bg = parts[parts.length - 1];
    if (bg < 16) return (bg === 7 || bg === 15) ? 'light' : 'dark';
    if (bg >= 232) return bg >= 244 ? 'light' : 'dark';
    const i = bg - 16;
    const cube = ColorDepth.CUBE;
    return ColorScheme._fromRgb({ r: cube[Math.floor(i / 36)], g: cube[Math.floor(i / 6) % 6], b: cube[i % 6] });
  }

  static fromOsc11(reply) {
    const m = /\x1b\]11;([^\x07\x1b]*)/.exec(String(reply || ''));
    if (!m) return null;
    const v = m[1].trim();
    const rgb = v.startsWith('#') ? ColorScheme._hexReply(v) : ColorScheme._rgbReply(v);
    return rgb ? ColorScheme._fromRgb(rgb) : null;
  }

  static luminance({ r, g, b }) {
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  static _fromRgb(rgb) {
    return ColorScheme.luminance(rgb) > 0.5 ? 'light' : 'dark';
  }

  static _hexReply(v) {
    const h = v.slice(1);
    if (/^[0-9a-f]{6}$/i.test(h)) return ColorDepth.hexToRgb(v);
    if (/^[0-9a-f]{12}$/i.test(h)) return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(4, 6), 16), b: parseInt(h.slice(8, 10), 16) };
    return null;
  }

  static _rgbReply(v) {
    const parts = v.replace(/^rgba?:/i, '').split('/');
    if (parts.length < 3) return null;
    const ch = (s) => Math.round((parseInt(s, 16) / (16 ** s.length - 1)) * 255);
    const rgb = { r: ch(parts[0]), g: ch(parts[1]), b: ch(parts[2]) };
    return [rgb.r, rgb.g, rgb.b].some((n) => !Number.isFinite(n)) ? null : rgb;
  }
}

module.exports = ColorScheme;
