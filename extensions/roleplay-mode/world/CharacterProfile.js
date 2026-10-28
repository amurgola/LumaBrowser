class CharacterProfile {
  static IDENTITY_KEYS = ['voice', 'tells'];
  static GROWTH_KEYS = ['wants', 'hides'];
  static TELLS_MAX = 3;
  static BOND_USER = 'user';

  static of(char) {
    const c = char || {};
    const p = c.profile && typeof c.profile === 'object' ? c.profile : {};
    return {
      summary: String(c.description || p.summary || '').trim(),
      appearance: String(c.appearance || p.appearance || '').trim(),
      voice: String(p.voice || '').trim(),
      wants: String(p.wants || '').trim(),
      hides: String(p.hides || '').trim(),
      tells: CharacterProfile._tells(p.tells),
      bonds: CharacterProfile._bonds(p.bonds),
    };
  }

  static isBlank(char) {
    const p = CharacterProfile.of(char);
    return !p.voice && !p.wants && !p.tells.length;
  }

  static apply(char, patch, { growthOnly = false } = {}) {
    if (!char || !patch || typeof patch !== 'object') return false;
    char.profile = char.profile && typeof char.profile === 'object' ? char.profile : {};
    let changed = false;
    if (!growthOnly) {
      if (!char.description && patch.summary) { char.description = String(patch.summary).trim(); changed = true; }
      if (!char.appearance && patch.appearance) { char.appearance = String(patch.appearance).trim(); changed = true; }
      for (const k of CharacterProfile.IDENTITY_KEYS) {
        if (CharacterProfile._has(char.profile[k]) || !CharacterProfile._has(patch[k])) continue;
        char.profile[k] = k === 'tells' ? CharacterProfile._tells(patch.tells) : String(patch[k]).trim();
        changed = true;
      }
    }
    for (const k of CharacterProfile.GROWTH_KEYS) {
      if (patch[k] === undefined || patch[k] === null) continue;
      const next = String(patch[k]).trim();
      if (next !== String(char.profile[k] || '').trim()) { char.profile[k] = next; changed = true; }
    }
    if (patch.bondUser !== undefined && patch.bondUser !== null) changed = CharacterProfile.setBond(char, CharacterProfile.BOND_USER, patch.bondUser) || changed;
    if (patch.bonds && typeof patch.bonds === 'object') {
      for (const [who, text] of Object.entries(patch.bonds)) changed = CharacterProfile.setBond(char, who, text) || changed;
    }
    return changed;
  }

  static setBond(char, who, text) {
    if (!char || !who) return false;
    char.profile = char.profile && typeof char.profile === 'object' ? char.profile : {};
    const bonds = CharacterProfile._bonds(char.profile.bonds);
    const key = String(who).trim();
    const next = String(text || '').trim();
    if ((bonds[key] || '') === next) return false;
    if (next) bonds[key] = next; else delete bonds[key];
    char.profile.bonds = bonds;
    return true;
  }

  static bondWithUser(char) {
    return CharacterProfile.of(char).bonds[CharacterProfile.BOND_USER] || '';
  }

  static _tells(list) {
    const arr = Array.isArray(list) ? list : (typeof list === 'string' && list.trim() ? list.split(/;|\n/) : []);
    return arr.map((t) => String(t || '').trim()).filter(Boolean).slice(0, CharacterProfile.TELLS_MAX);
  }

  static _bonds(obj) {
    const out = {};
    if (!obj || typeof obj !== 'object') return out;
    for (const [k, v] of Object.entries(obj)) {
      const key = String(k || '').trim();
      const val = String(v || '').trim();
      if (key && val) out[key] = val;
    }
    return out;
  }

  static _has(v) {
    return Array.isArray(v) ? v.length > 0 : !!(v && String(v).trim());
  }
}

module.exports = CharacterProfile;
