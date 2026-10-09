class OutfitText {
  static SLOT_KEYS = ['outer', 'top', 'bottom', 'feet'];
  static NAME_MAX = 28;
  static NEGATION = /\b(no|not|without|sans|minus|bare|missing|removed|off|absent)\b/;

  static normalize(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9, ]/g, '').replace(/\s+/g, ' ').trim();
  }

  static same(a, b) {
    const na = OutfitText.normalize(a);
    const nb = OutfitText.normalize(b);
    if (na === nb) return true;
    if (!na || !nb) return false;
    if (OutfitText.NEGATION.test(na) || OutfitText.NEGATION.test(nb)) return false;
    return OutfitText._tokenSubset(na, nb);
  }

  static sameSlots(a, b) {
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return null;
    return OutfitText.SLOT_KEYS.every((k) => OutfitText.same(a[k] || '', b[k] || ''));
  }

  static displayName(desc) {
    const d = String(desc || '').trim();
    if (!d) return 'Outfit';
    const first = d.split(',')[0].trim();
    const max = OutfitText.NAME_MAX;
    return (first.length > max ? first.slice(0, max) + '…' : first) || 'Outfit';
  }

  static renderDesc(s) {
    return String(s || '')
      .replace(/\bfaded\b/gi, 'muted-colour')
      .replace(/\bworn(?:-out)?\b/gi, 'soft');
  }

  static _tokenSubset(na, nb) {
    const toks = (s) => new Set(s.split(/[ ,]+/).filter((w) => w.length > 2));
    const ta = toks(na);
    const tb = toks(nb);
    if (!ta.size || !tb.size) return false;
    const small = ta.size <= tb.size ? ta : tb;
    const big = ta.size <= tb.size ? tb : ta;
    for (const w of small) if (!big.has(w)) return false;
    return true;
  }
}

module.exports = OutfitText;
