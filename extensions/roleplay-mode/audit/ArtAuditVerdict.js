class ArtAuditVerdict {
  static parse(text) {
    const s = String(text || '');
    const a = s.indexOf('{');
    const b = s.lastIndexOf('}');
    if (a < 0 || b <= a) return null;
    try { return JSON.parse(s.slice(a, b + 1)); } catch (_) { return null; }
  }

  static usable(v) {
    return !!v && Number.isFinite(Number(v.people));
  }

  static isBad(v, item) {
    if (!v || typeof v !== 'object') return false;
    const people = Number(v.people);
    if (Number.isFinite(people) && people > 1) return true;
    if (v.character_sheet === true) return true;
    if (item.kind !== 'avatar' && v.flat_green_background === false) return true;
    if (v.damaged === true) return true;
    return item.kind === 'outfit' && v.wrong_clothing === true;
  }
}

module.exports = ArtAuditVerdict;
