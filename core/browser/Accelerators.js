class Accelerators {
  static IS_MAC = process.platform === 'darwin';

  static MAIN_HANDLED = new Set([
    'reload', 'hard-reload', 'back', 'forward', 'stop',
    'zoom-in', 'zoom-out', 'zoom-reset', 'devtools', 'print',
  ]);

  static LETTER_ACTIONS = {
    t: (shift) => (shift ? 'reopen-closed' : 'new-tab'),
    w: () => 'close-tab',
    r: (shift) => (shift ? 'hard-reload' : 'reload'),
    l: () => 'focus-url',
    f: () => 'find',
    g: (shift) => (shift ? 'find-prev' : 'find-next'),
    d: (shift) => (shift ? null : 'bookmark'),
    u: (shift) => (shift ? 'runtime-trace' : null),
    h: () => 'history',
    p: () => 'print',
    '=': () => 'zoom-in',
    '+': () => 'zoom-in',
    '-': () => 'zoom-out',
    '0': () => 'zoom-reset',
  };

  static match(input, ctx = {}) {
    if (!Accelerators._isKeyDown(input)) return null;
    const keys = Accelerators._readKeys(input);
    if (Accelerators._isAltGr(input, keys)) return null;
    if (!keys.mod && !keys.alt) return Accelerators._matchUnmodified(keys, ctx);
    if (keys.alt && !keys.mod) return Accelerators._matchAltChord(keys);
    return Accelerators._matchPrimaryChord(keys);
  }

  static _isKeyDown(input) {
    return !!input && input.type === 'keyDown';
  }

  static _readKeys(input) {
    const key = input.key || '';
    return {
      key,
      lower: key.length === 1 ? key.toLowerCase() : key,
      mod: Accelerators._primaryModifier(input),
      shift: !!input.shift,
      alt: !!input.alt,
    };
  }

  static _primaryModifier(input) {
    return Accelerators.IS_MAC ? !!input.meta : !!input.control;
  }

  static _isAltGr(input, keys) {
    return !Accelerators.IS_MAC && !!input.control && keys.alt;
  }

  static _matchUnmodified({ key, shift }, ctx) {
    if (key === 'F5') return shift ? 'hard-reload' : 'reload';
    if (key === 'F6') return 'focus-url';
    if (key === 'F3') return shift ? 'find-prev' : 'find-next';
    if (key === 'F12') return 'devtools';
    if (key === 'Escape' && ctx.loading) return 'stop';
    return null;
  }

  static _matchAltChord({ key, lower }) {
    if (key === 'ArrowLeft') return 'back';
    if (key === 'ArrowRight') return 'forward';
    if (!Accelerators.IS_MAC && lower === 'd') return 'focus-url';
    return null;
  }

  static _matchPrimaryChord(keys) {
    return Accelerators._matchMacChord(keys)
      || Accelerators._matchTabKey(keys)
      || Accelerators._matchLetter(keys);
  }

  static _matchMacChord({ key, shift, alt }) {
    if (!Accelerators.IS_MAC) return null;
    if (key === '[' && !shift) return 'back';
    if (key === ']' && !shift) return 'forward';
    if (alt && key === 'ArrowRight') return 'next-tab';
    if (alt && key === 'ArrowLeft') return 'prev-tab';
    return null;
  }

  static _matchTabKey({ key, shift }) {
    if (key === 'Tab') return shift ? 'prev-tab' : 'next-tab';
    if (key === 'PageDown') return 'next-tab';
    if (key === 'PageUp') return 'prev-tab';
    if (key === 'F4') return 'close-tab';
    if (key === 'F5') return 'hard-reload';
    if (/^[1-8]$/.test(key)) return `select-tab-${key}`;
    if (key === '9') return 'select-last-tab';
    return null;
  }

  static _matchLetter({ lower, shift }) {
    const action = Object.prototype.hasOwnProperty.call(Accelerators.LETTER_ACTIONS, lower)
      ? Accelerators.LETTER_ACTIONS[lower]
      : null;
    return action ? action(shift) : null;
  }
}

module.exports = Accelerators;
