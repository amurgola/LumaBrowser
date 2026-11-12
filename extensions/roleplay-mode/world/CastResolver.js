class CastResolver {
  static currentEntries(data) {
    const d = data || {};
    const chars = Array.isArray(d.characters) ? d.characters : [];
    const entries = d.currentState && Array.isArray(d.currentState.characters) ? d.currentState.characters : [];
    return entries
      .filter((s) => s && s.present !== false)
      .map((s) => {
        const char = chars.find((c) => CastResolver._stateMatches(c, s));
        return char ? { char, state: s } : null;
      })
      .filter(Boolean);
  }

  static forMoment(data, content) {
    const fromState = CastResolver.currentEntries(data);
    if (fromState.length) return fromState;
    const chars = Array.isArray(data && data.characters) ? data.characters : [];
    const lower = String(content || '').toLowerCase();
    return chars
      .filter((c) => c.name && lower.includes(String(c.name).toLowerCase()))
      .map((char) => ({ char, state: null }));
  }

  static byName(data, name) {
    const n = String(name || '').toLowerCase();
    if (!n) return null;
    const chars = (data && data.characters) || [];
    return chars.find((c) => c && c.name && c.name.toLowerCase() === n)
      || chars.find((c) => c && Array.isArray(c.aliases) && c.aliases.some((a) => String(a || '').toLowerCase() === n))
      || CastResolver.byPartOfName(chars, n);
  }

  static isPlayer(data, name) {
    const p = data && data.protagonist && typeof data.protagonist === 'object' ? String(data.protagonist.name || '') : '';
    const words = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter((w) => w && !CastResolver.TITLES.has(w));
    const mine = words(p);
    const theirs = words(name);
    if (!mine.length || !theirs.length) return false;
    return theirs.every((w) => mine.includes(w));
  }

  static TITLES = new Set(['mr', 'mrs', 'ms', 'miss', 'dr', 'sir', 'lady', 'lord', 'captain', 'sister', 'brother', 'father', 'professor', 'officer']);

  static byPartOfName(chars, name) {
    const words = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter((w) => w && !CastResolver.TITLES.has(w));
    const want = words(name);
    if (!want.length) return null;
    const fits = (chars || []).filter((c) => {
      if (!c || !c.name) return false;
      const have = words(c.name);
      if (!have.length) return false;
      const [small, big] = want.length <= have.length ? [want, have] : [have, want];
      return small.every((w) => big.includes(w));
    });
    return fits.length === 1 ? fits[0] : null;
  }

  static orderByFocus(entries, shot) {
    if (!(shot && Array.isArray(shot.focus) && shot.focus.length)) return entries;
    const want = shot.focus.map((n) => String(n || '').toLowerCase());
    const rank = (e) => {
      const i = want.indexOf(CastResolver._entryName(e));
      return i < 0 ? want.length : i;
    };
    let out = entries.slice().sort((a, b) => rank(a) - rank(b));
    if (!shot.group && want.length === 1) {
      const only = out.filter((e) => want.indexOf(CastResolver._entryName(e)) >= 0);
      if (only.length) out = only;
    }
    return out;
  }

  static _stateMatches(char, state) {
    return (state.charId && char.id === state.charId)
      || (!state.charId && state.name && char.name && char.name.toLowerCase() === String(state.name).toLowerCase());
  }

  static _entryName(entry) {
    return String((entry.char && entry.char.name) || '').toLowerCase();
  }
}

module.exports = CastResolver;
