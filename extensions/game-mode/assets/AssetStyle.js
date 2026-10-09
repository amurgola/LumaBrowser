class AssetStyle {
  static PREFIX = {
    'pixel-art': 'pixel art game sprite, crisp pixels, limited palette',
    cartoon: 'cartoon game sprite, bold clean outlines, flat cel shading',
    painted: 'hand-painted game art, soft lighting, rich color',
    flat: 'flat vector-style game asset, simple geometric shapes, solid colors',
  };

  static TRANSPARENT_BACKGROUND = 'single subject isolated on a flat uniform solid green screen background, '
    + 'no texture, no noise, no particles, no shadow, fully in frame';
  static OPAQUE_BACKGROUND = 'centered, plain solid background';

  static normalize(raw) {
    if (!raw) return null;
    const s = String(raw).toLowerCase().trim();
    if (AssetStyle.PREFIX[s]) return s;
    if (/pixel|8[- ]?bit|retro/.test(s)) return 'pixel-art';
    if (/paint|watercolou?r|oil|illustrat/.test(s)) return 'painted';
    if (/flat|vector|minimal|geometric/.test(s)) return 'flat';
    if (/cartoon|anime|comic|cel|toon/.test(s)) return 'cartoon';
    return null;
  }

  static isKnown(style) {
    return !!AssetStyle.PREFIX[style];
  }

  static prompt(subject, style, transparent) {
    const prefix = AssetStyle.PREFIX[style] || 'game asset';
    const background = transparent ? AssetStyle.TRANSPARENT_BACKGROUND : AssetStyle.OPAQUE_BACKGROUND;
    return `${prefix}, ${String(subject || '').trim()}, ${background}`;
  }

  static noteFor(rawStyle, coercedStyle) {
    if (!rawStyle || AssetStyle.isKnown(rawStyle)) return '';
    if (coercedStyle) return `style "${rawStyle}" read as "${coercedStyle}"`;
    return `style "${rawStyle}" is not one of pixel-art/cartoon/painted/flat, ignored`;
  }
}

module.exports = AssetStyle;
