const ThemePalettes = require('./ThemePalettes');
const ColorDepth = require('./ColorDepth');
const ColorScheme = require('./ColorScheme');

class Theme {
  constructor({ depth = 24, scheme = 'dark', ascii = false } = {}) {
    this.depth = depth;
    this.scheme = scheme;
    this.ascii = ascii;
    this.glyph = ascii ? ThemePalettes.GLYPHS.ascii : ThemePalettes.GLYPHS.unicode;
    this.palette = ThemePalettes.PALETTES[scheme] || ThemePalettes.PALETTES.dark;
    this._fg = new Map();
    this._bg = new Map();
    this.c = {};
    for (const slot of Object.keys(this.palette)) {
      this._fg.set(slot, this.sgrFor(slot, false));
      this._bg.set(slot, this.sgrFor(slot, true));
      this.c[slot] = (t) => this.fg(slot, t);
    }
  }

  static create({ stream = process.stdout, env = process.env, scheme } = {}) {
    const depth = ColorDepth.detect(stream, env);
    const ascii = env.LUMA_CLI_ASCII === '1' || env.TERM === 'dumb';
    const picked = scheme || Theme._envScheme(env) || ColorScheme.fromColorFgBg(env.COLORFGBG) || 'dark';
    return new Theme({ depth, scheme: picked, ascii });
  }

  get color() { return this.depth > 1; }

  sgrFor(slot, bg) {
    if (this.depth <= 1) return '';
    const rgb = ColorDepth.hexToRgb(this.palette[slot]);
    const base = bg ? 48 : 38;
    if (this.depth >= 24) return `\x1b[${base};2;${rgb.r};${rgb.g};${rgb.b}m`;
    if (this.depth >= 8) return `\x1b[${base};5;${ColorDepth.rgbTo256(rgb)}m`;
    const code = ThemePalettes.BASIC[slot];
    if (!code) return '';
    return `\x1b[${bg ? code + 10 : code}m`;
  }

  fg(slot, text) {
    const s = this._fg.get(slot);
    return s ? `${s}${text}\x1b[39m` : String(text);
  }

  bg(slot, text) {
    const s = this._bg.get(slot);
    return s ? `${s}${text}\x1b[49m` : String(text);
  }

  bold(t) { return this._attr(t, 1, 22); }

  dim(t) { return this._attr(t, 2, 22); }

  italic(t) { return this._attr(t, 3, 23); }

  underline(t) { return this._attr(t, 4, 24); }

  inverse(t) { return this._attr(t, 7, 27); }

  strike(t) { return this._attr(t, 9, 29); }

  link(url, text) {
    if (!this.color) return String(text);
    return `\x1b]8;;${url}\x1b\\${text}\x1b]8;;\x1b\\`;
  }

  hint(key, label) {
    return `${this.fg('dim', key)} ${this.fg('muted', label)}`;
  }

  _attr(t, on, off) {
    return this.color ? `\x1b[${on}m${t}\x1b[${off}m` : String(t);
  }

  static _envScheme(env) {
    if (env.LUMA_CLI_THEME === 'light') return 'light';
    if (env.LUMA_CLI_THEME === 'dark') return 'dark';
    return null;
  }
}

module.exports = Theme;
