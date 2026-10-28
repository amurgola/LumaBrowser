class X11ChordPoller {
  static MODIFIERS = Object.freeze([
    [0x10, [0xffe1, 0xffe2]], [0x11, [0xffe3, 0xffe4]], [0x12, [0xffe9, 0xffea]], [0x5b, [0xffeb, 0xffec]],
  ]);

  constructor({ keycodeOf }) {
    this._keycodeOf = keycodeOf;
    this._modifiers = X11ChordPoller.MODIFIERS.map(([vk, keysyms]) => [vk, keysyms.map((k) => keycodeOf(k)).filter((c) => c > 0)]);
    this._chords = [];
    this._wasDown = new Map();
  }

  setChords(chords) {
    const unmapped = [];
    this._chords = [];
    this._wasDown = new Map();
    for (const c of chords || []) {
      const code = c && c.keysym ? this._keycodeOf(c.keysym) : 0;
      if (!(code > 0)) { unmapped.push(c && c.id); continue; }
      this._chords.push({ id: c.id, code, modifiers: [...new Set(c.modifiers || [])].sort((a, b) => a - b) });
    }
    return unmapped.filter(Boolean);
  }

  get chordCount() {
    return this._chords.length;
  }

  tick(down) {
    const held = this._modifiers.filter(([, codes]) => codes.some((c) => down(c))).map(([vk]) => vk);
    const fired = [];
    for (const chord of this._chords) {
      const isDown = !!down(chord.code);
      const was = this._wasDown.get(chord.id) === true;
      this._wasDown.set(chord.id, isDown);
      if (isDown && !was && X11ChordPoller._same(held, chord.modifiers)) fired.push(chord.id);
    }
    return { held, fired };
  }

  static _same(a, b) {
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }
}

module.exports = X11ChordPoller;
