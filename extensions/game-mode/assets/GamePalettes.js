class GamePalettes {
  static MAX_COLOURS = 256;

  static PRESETS = {
    'pico-8': ['000000', '1d2b53', '7e2553', '008751', 'ab5236', '5f574f', 'c2c3c7', 'fff1e8',
      'ff004d', 'ffa300', 'ffec27', '00e436', '29adff', '83769c', 'ff77a8', 'ffccaa'],
    'game-boy': ['0f380f', '306230', '8bac0f', '9bbc0f'],
    'sweetie-16': ['1a1c2c', '5d275d', 'b13e53', 'ef7d57', 'ffcd75', 'a7f070', '38b764', '257179',
      '29366f', '3b5dc9', '41a6f6', '73eff7', 'f4f4f4', '94b0c2', '566c86', '333c57'],
    'endesga-32': ['be4a2f', 'd77643', 'ead4aa', 'e4a672', 'b86f50', '733e39', '3e2731', 'a22633',
      'e43b44', 'f77622', 'feae34', 'fee761', '63c74d', '3e8948', '265c42', '193c3e',
      '124e89', '0099db', '2ce8f5', 'ffffff', 'c0cbdc', '8b9bb4', '5a6988', '3a4466',
      '262b44', '181425', 'ff0044', '68386c', 'b55088', 'f6757a', 'e8b796', 'c28569'],
  };

  static resolve(data) {
    const d = data || {};
    const id = String(d.palette || '').trim().toLowerCase();
    if (!id) return null;
    if (id === 'custom') return GamePalettes.parse(d.paletteCustom);
    const preset = GamePalettes.PRESETS[id];
    return preset ? preset.map((hex) => `#${hex}`) : null;
  }

  static parse(text) {
    const tokens = String(text || '').match(/#?\b[0-9a-f]+\b/gi) || [];
    const colours = tokens.map(GamePalettes._expand).filter(Boolean);
    const unique = [...new Set(colours)].slice(0, GamePalettes.MAX_COLOURS);
    return unique.length ? unique : null;
  }

  static toRgb(palette) {
    return (palette || []).map((hex) => [0, 2, 4].map((i) => parseInt(hex.slice(1 + i, 3 + i), 16)));
  }

  static _expand(raw) {
    const h = raw.replace('#', '').toLowerCase();
    if (h.length === 3) return `#${h.split('').map((c) => c + c).join('')}`;
    if (h.length === 6) return `#${h}`;
    if (h.length === 8) return `#${h.startsWith('ff') ? h.slice(2) : h.slice(0, 6)}`;
    return null;
  }
}

module.exports = GamePalettes;
