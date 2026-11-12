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
    const wearing = CharacterMarks._key(char.currentOutfitDesc || '');
    let changed = false;
    for (const raw of details) {
      const text = String(raw || '').replace(/\s+/g, ' ').trim().slice(0, CharacterMarks.TEXT_MAX);
      const key = CharacterMarks._key(text);
      if (!key || known.has(key) || (looks && looks.includes(key))) continue;
      if (CharacterMarks.PASSING.test(text) || CharacterMarks._wornWord(key, wearing)) continue;
      known.add(key);
      marks.push({ turn: Number(turn) || 0, text });
      changed = true;
    }
    if (!changed) return false;
    char.marks = marks.slice(-CharacterMarks.MAX);
    return true;
  }

  static PASSING = /\b(?:tell|habit|gesture|expression|movements?|moves|moving|tapping|taps|fidget\w*|dangling|crack\w*|click\w*|creak\w*|gripping|as (?:she|he|they)|trembl\w*|shak\w*|white from|when (?:she|he|they)|whenever|rhythm|posture|glance|gaze|smile|frown|stare|voice|tone)\b/i;

  static _wornWord(key, wearing) {
    const first = key.split(' ')[0];
    return !!(first && first.length > 3 && wearing && wearing.split(' ').includes(first));
  }

  static line(char) {
    return CharacterMarks.of(char).map((m) => m.text).join('; ');
  }

  static _key(text) {
    return String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }
}

module.exports = CharacterMarks;
