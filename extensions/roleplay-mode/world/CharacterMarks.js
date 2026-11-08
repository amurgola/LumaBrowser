class CharacterMarks {
  static MAX = 10;
  static TEXT_MAX = 120;

  static of(char) {
    const list = char && Array.isArray(char.marks) ? char.marks : [];
    return list.filter((m) => m && typeof m.text === 'string' && m.text.trim());
  }

  static add(char, details, turn = 0) {
    if (!char || !Array.isArray(details)) return false;
    const marks = CharacterMarks.of(char).slice();
    const known = new Set(marks.map((m) => CharacterMarks._key(m.text)));
    const looks = CharacterMarks._key(char.appearance || '');
    let changed = false;
    for (const raw of details) {
      const text = String(raw || '').replace(/\s+/g, ' ').trim().slice(0, CharacterMarks.TEXT_MAX);
      const key = CharacterMarks._key(text);
      if (!key || known.has(key) || (looks && looks.includes(key))) continue;
      known.add(key);
      marks.push({ turn: Number(turn) || 0, text });
      changed = true;
    }
    if (!changed) return false;
    char.marks = marks.slice(-CharacterMarks.MAX);
    return true;
  }

  static line(char) {
    return CharacterMarks.of(char).map((m) => m.text).join('; ');
  }

  static _key(text) {
    return String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }
}

module.exports = CharacterMarks;
