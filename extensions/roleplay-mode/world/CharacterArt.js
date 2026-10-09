const OutfitText = require('./OutfitText');

class CharacterArt {
  static bodyRef(c) {
    if (!c) return null;
    const cur = CharacterArt._currentOutfit(c);
    if (cur && cur.b64) return cur.b64;
    if (c.figure && c.figure.b64) return c.figure.b64;
    if (c.art && c.art.fullBody && c.art.fullBody.b64) return c.art.fullBody.b64;
    if (c.art && c.art.base && c.art.base.b64) return c.art.base.b64;
    if (c.avatar && c.avatar.b64) return c.avatar.b64;
    return null;
  }

  static bodyRefForState(c, state) {
    if (c && state) {
      const outfits = Array.isArray(c.outfits) ? c.outfits : [];
      if (state.outfitId) {
        const byId = outfits.find((o) => o && o.id === state.outfitId && o.b64);
        if (byId) return byId.b64;
      }
      if (state.outfitDesc) {
        const want = OutfitText.normalize(state.outfitDesc);
        const byDesc = want && outfits.find((o) => o && o.b64 && OutfitText.normalize(o.desc) === want);
        if (byDesc) return byDesc.b64;
      }
    }
    return CharacterArt.bodyRef(c);
  }

  static faceRef(char, emotion) {
    const art = (char && char.art) || {};
    if (emotion && art[emotion] && art[emotion].b64) return art[emotion].b64;
    if (art.base && art.base.b64) return art.base.b64;
    if (char && char.avatar && char.avatar.b64) return char.avatar.b64;
    return null;
  }

  static headRef(char) {
    return (char && char.art && char.art.base && char.art.base.b64) || (char && char.avatar && char.avatar.b64) || null;
  }

  static hasFullBody(char) {
    if (!char) return false;
    const cur = CharacterArt._currentOutfit(char);
    if (cur && cur.b64) return true;
    if (char.figure && char.figure.b64) return true;
    return !!(char.art && char.art.fullBody && char.art.fullBody.b64);
  }

  static _currentOutfit(c) {
    const outfits = Array.isArray(c.outfits) ? c.outfits : [];
    return c.currentOutfit ? outfits.find((o) => o && o.id === c.currentOutfit) : null;
  }
}

module.exports = CharacterArt;
