const CastResolver = require('./CastResolver');
const CastRole = require('./CastRole');

class CastRename {
  static apply(data, ex, delta) {
    const done = [];
    if (!ex || !Array.isArray(ex.characters)) return done;
    CastRename._infer(data, ex);
    for (const ec of ex.characters) {
      if (!ec || !ec.was || !ec.name) continue;
      const walkOn = CastResolver.byName(data, ec.was);
      if (!walkOn || !CastRename.canRename(walkOn, ec.name)) continue;
      if (!CastRename._clearFresh(data, ec.name, walkOn, delta)) continue;
      const from = walkOn.name;
      CastRename.rename(data, walkOn, ec.name);
      done.push({ from, to: ec.name });
      delta.changed = true;
    }
    return done;
  }

  static canRename(char, name) {
    if (!char || !name || char.origin !== CastRole.STORY) return false;
    if (String(char.name).toLowerCase() === String(name).toLowerCase()) return false;
    return CastRole.isLabel(char.name) && !CastRole.isLabel(name);
  }

  static _infer(data, ex) {
    if (ex.characters.some((c) => c && c.was)) return;
    const listed = new Set(((ex.currentState && ex.currentState.characters) || []).map((c) => String(c.name || '').toLowerCase()));
    const presentNow = new Set(((ex.currentState && ex.currentState.characters) || []).filter((c) => c.present !== false).map((c) => String(c.name || '').toLowerCase()));
    const walkOns = CastResolver.currentEntries(data).map((e) => e.char)
      .filter((c) => c.origin === CastRole.STORY && CastRole.isLabel(c.name) && !listed.has(String(c.name).toLowerCase()));
    const named = ex.characters.filter((c) => c && c.name && !CastRole.isLabel(c.name) && presentNow.has(c.name.toLowerCase())
      && !CastRename._established(data, c.name));
    if (walkOns.length === 1 && named.length === 1) named[0].was = walkOns[0].name;
  }

  static _established(data, name) {
    const c = CastResolver.byName(data, name);
    return !!(c && ((c.chronicle && Array.isArray(c.chronicle.beats) && c.chronicle.beats.length) || c.profile || c.state));
  }

  static _clearFresh(data, name, walkOn, delta) {
    const other = CastResolver.byName(data, name);
    if (!other || other === walkOn) return true;
    if (CastRename._established(data, name)) return false;
    data.characters = data.characters.filter((c) => c !== other);
    if (delta && Array.isArray(delta.newCharIds)) delta.newCharIds = delta.newCharIds.filter((id) => id !== other.id);
    return true;
  }

  static rename(data, char, name) {
    const from = char.name;
    const to = String(name).trim();
    char.aliases = Array.from(new Set((Array.isArray(char.aliases) ? char.aliases : []).concat([from])));
    char.name = to;
    const same = (n) => String(n || '').toLowerCase() === String(from).toLowerCase();
    for (const e of (data.currentState && data.currentState.characters) || []) {
      if (e && (e.charId === char.id || same(e.name))) e.name = to;
    }
    for (const c of data.characters || []) {
      const bonds = c && c.profile && c.profile.bonds;
      if (!bonds || typeof bonds !== 'object') continue;
      for (const key of Object.keys(bonds)) {
        if (!same(key)) continue;
        if (bonds[to] === undefined) bonds[to] = bonds[key];
        delete bonds[key];
      }
    }
    for (const row of (data.story && data.story.ledger) || []) {
      if (row && Array.isArray(row.who)) row.who = row.who.map((n) => (same(n) ? to : n));
    }
    return char;
  }
}

module.exports = CastRename;
