class CharacterState {
  static FIELDS = ['present', 'sceneId', 'emotion', 'intent', 'posture', 'bondUser', 'bondNote', 'condition', 'lastSeen'];
  static NOTE_MAX = 160;

  static of(char) {
    const c = char || {};
    const s = c.state && typeof c.state === 'object' ? c.state : {};
    return {
      present: s.present === true,
      sceneId: s.sceneId || null,
      emotion: String(s.emotion || '').trim(),
      intent: String(s.intent || '').trim(),
      posture: String(s.posture || '').trim(),
      bondUser: String(s.bondUser || '').trim(),
      bondNote: String(s.bondNote || '').trim(),
      condition: String(s.condition || '').trim(),
      lastSeen: s.lastSeen && typeof s.lastSeen === 'object'
        ? { turn: Number(s.lastSeen.turn) || 0, sceneId: s.lastSeen.sceneId || null, note: String(s.lastSeen.note || '').trim() }
        : null,
    };
  }

  static arrive(char, sceneId, reading = {}) {
    if (!char) return false;
    const prev = CharacterState.of(char);
    const next = {
      present: true,
      sceneId: sceneId || prev.sceneId,
      emotion: CharacterState._text(reading.emotion, ''),
      intent: CharacterState._text(reading.intent, prev.intent),
      posture: CharacterState._text(reading.posture, ''),
      bondUser: CharacterState._text(reading.bondUser, prev.bondUser),
      bondNote: CharacterState._text(reading.bondNote, prev.bondNote),
      condition: reading.condition === undefined || reading.condition === null ? prev.condition : CharacterState._text(reading.condition, ''),
      lastSeen: null,
    };
    return CharacterState._write(char, next);
  }

  static depart(char, { turn, sceneId, note }) {
    if (!char) return false;
    const prev = CharacterState.of(char);
    const next = Object.assign({}, prev, {
      present: false,
      emotion: '',
      posture: '',
      lastSeen: {
        turn: Number(turn) || 0,
        sceneId: sceneId || prev.sceneId || null,
        note: CharacterState._text(note, prev.lastSeen ? prev.lastSeen.note : ''),
      },
    });
    return CharacterState._write(char, next);
  }

  static line(char) {
    const s = CharacterState.of(char);
    const bits = [];
    if (s.emotion) bits.push(s.emotion);
    if (s.posture) bits.push(s.posture);
    if (s.intent) bits.push('wants: ' + s.intent);
    if (s.condition) bits.push('condition: ' + s.condition);
    if (s.bondUser) bits.push('toward the player: ' + s.bondUser + (s.bondNote ? ' (' + s.bondNote + ')' : ''));
    return bits.join('; ');
  }

  static absentLine(char, sceneName = '') {
    const s = CharacterState.of(char);
    if (!s.lastSeen) return '';
    const where = sceneName ? 'last seen at ' + sceneName : 'off stage';
    return where + (s.lastSeen.note ? ': ' + s.lastSeen.note : '');
  }

  static _text(v, fallback) {
    const t = v === undefined || v === null ? '' : String(v).trim();
    return (t || fallback || '').slice(0, CharacterState.NOTE_MAX);
  }

  static _write(char, next) {
    const prev = JSON.stringify(CharacterState.of(char));
    char.state = next;
    return prev !== JSON.stringify(CharacterState.of(char));
  }
}

module.exports = CharacterState;
