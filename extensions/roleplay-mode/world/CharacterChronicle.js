class CharacterChronicle {
  static MAX_BEATS = 12;
  static FOLD_COUNT = 8;
  static KEEP_VERBATIM = 4;
  static BEAT_MAX_CHARS = 240;

  static of(char) {
    const c = char || {};
    const ch = c.chronicle && typeof c.chronicle === 'object' ? c.chronicle : {};
    return {
      arc: String(ch.arc || '').trim(),
      beats: Array.isArray(ch.beats) ? ch.beats.filter((b) => b && b.text) : [],
    };
  }

  static addBeat(char, { turn, messageId, text }) {
    const clean = String(text || '').trim().slice(0, CharacterChronicle.BEAT_MAX_CHARS);
    if (!char || !clean) return false;
    const ch = CharacterChronicle._ensure(char);
    const beat = { turn: Number(turn) || 0, messageId: messageId || null, text: clean };
    const i = messageId ? ch.beats.findIndex((b) => b.messageId === messageId) : -1;
    if (i >= 0) {
      if (ch.beats[i].text === clean) return false;
      ch.beats[i] = beat;
    } else {
      ch.beats.push(beat);
    }
    return true;
  }

  static needsFold(char) {
    return CharacterChronicle.of(char).beats.length > CharacterChronicle.MAX_BEATS;
  }

  static foldable(char) {
    const beats = CharacterChronicle.of(char).beats;
    const n = Math.min(CharacterChronicle.FOLD_COUNT, Math.max(0, beats.length - CharacterChronicle.KEEP_VERBATIM));
    return beats.slice(0, n);
  }

  static applyFold(char, arcText, foldedCount) {
    const arc = String(arcText || '').trim();
    if (!char || !arc) return false;
    const ch = CharacterChronicle._ensure(char);
    ch.arc = arc;
    ch.beats = ch.beats.slice(Math.max(0, Math.min(foldedCount, ch.beats.length)));
    return true;
  }

  static recent(char, n = CharacterChronicle.KEEP_VERBATIM) {
    const beats = CharacterChronicle.of(char).beats;
    return beats.slice(Math.max(0, beats.length - n));
  }

  static forget(char, messageId) {
    if (!char || !messageId || !char.chronicle || !Array.isArray(char.chronicle.beats)) return false;
    const before = char.chronicle.beats.length;
    char.chronicle.beats = char.chronicle.beats.filter((b) => !b || b.messageId !== messageId);
    return char.chronicle.beats.length !== before;
  }

  static _ensure(char) {
    if (!char.chronicle || typeof char.chronicle !== 'object') char.chronicle = { arc: '', beats: [] };
    if (!Array.isArray(char.chronicle.beats)) char.chronicle.beats = [];
    if (typeof char.chronicle.arc !== 'string') char.chronicle.arc = '';
    return char.chronicle;
  }
}

module.exports = CharacterChronicle;
