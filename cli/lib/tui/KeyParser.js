class KeyParser {
  static PASTE_START = '\x1b[200~';
  static PASTE_END = '\x1b[201~';
  static CSI_FINAL = { A: 'up', B: 'down', C: 'right', D: 'left', H: 'home', F: 'end', Z: 'tab' };
  static CSI_TILDE = { 1: 'home', 2: 'insert', 3: 'delete', 4: 'end', 5: 'pageup', 6: 'pagedown', 7: 'home', 8: 'end', 11: 'f1', 12: 'f2', 13: 'f3', 14: 'f4', 15: 'f5', 17: 'f6', 18: 'f7', 19: 'f8', 20: 'f9', 21: 'f10', 23: 'f11', 24: 'f12' };
  static SS3 = { A: 'up', B: 'down', C: 'right', D: 'left', H: 'home', F: 'end', P: 'f1', Q: 'f2', R: 'f3', S: 'f4' };

  static key(name, extra) {
    return Object.assign({ name, ch: '', ctrl: false, alt: false, shift: false }, extra || {});
  }

  static parse(s, state = {}) {
    const keys = [];
    let i = 0;
    while (i < s.length) {
      const step = state.pasting ? KeyParser._paste(s, i, state) : KeyParser._one(s, i, state);
      if (step.incomplete) return { keys, rest: step.rest };
      if (step.key) keys.push(step.key);
      i = step.next;
    }
    return { keys, rest: '' };
  }

  static _withMods(k, mod) {
    const m = (mod || 1) - 1;
    k.shift = !!(m & 1);
    k.alt = !!(m & 2);
    k.ctrl = !!(m & 4);
    return k;
  }

  static _paste(s, i, state) {
    const end = s.indexOf(KeyParser.PASTE_END, i);
    if (end === -1) { state.pasteBuf += s.slice(i); return { incomplete: true, rest: '' }; }
    state.pasteBuf += s.slice(i, end);
    const key = KeyParser.key('paste', { ch: state.pasteBuf.replace(/\r\n?/g, '\n') });
    state.pasting = false;
    state.pasteBuf = '';
    return { key, next: end + KeyParser.PASTE_END.length };
  }

  static _one(s, i, state) {
    const c = s[i];
    if (c === '\x1b') return KeyParser._escape(s, i, state);
    if (c === '\r' || c === '\n') return { key: c === '\n' ? KeyParser.key('ctrl', { ch: 'j', ctrl: true }) : KeyParser.key('enter'), next: i + 1 };
    if (c === '\t') return { key: KeyParser.key('tab'), next: i + 1 };
    if (c === '\x7f' || c === '\b') return { key: KeyParser.key('backspace'), next: i + 1 };
    const code = c.charCodeAt(0);
    if (code < 0x20) return { key: KeyParser.key('ctrl', { ch: String.fromCharCode(code + 96), ctrl: true }), next: i + 1 };
    const ch = String.fromCodePoint(s.codePointAt(i));
    return { key: KeyParser.key('char', { ch }), next: i + ch.length };
  }

  static _escape(s, i, state) {
    if (s.startsWith(KeyParser.PASTE_START, i)) {
      state.pasting = true;
      state.pasteBuf = '';
      return { next: i + KeyParser.PASTE_START.length };
    }
    const n = s[i + 1];
    if (n === undefined) return { incomplete: true, rest: s.slice(i) };
    if (n === '[') return KeyParser._csiStep(s, i);
    if (n === 'O') return KeyParser._ss3(s, i);
    if (n === ']' || n === 'P' || n === '_') return KeyParser._osc(s, i);
    if (n === '\x1b') return { key: KeyParser.key('escape'), next: i + 1 };
    return { key: KeyParser._altKey(n), next: i + 2 };
  }

  static _csiStep(s, i) {
    const r = KeyParser._csi(s, i);
    return r ? { key: r.k, next: i + r.len } : { incomplete: true, rest: s.slice(i) };
  }

  static _ss3(s, i) {
    const f = s[i + 2];
    if (f === undefined) return { incomplete: true, rest: s.slice(i) };
    return { key: KeyParser.key(KeyParser.SS3[f] || 'unknown'), next: i + 3 };
  }

  static _osc(s, i) {
    for (let j = i + 2; j < s.length; j++) {
      if (s[j] === '\x07') return { key: KeyParser.key('osc', { ch: s.slice(i, j + 1) }), next: j + 1 };
      if (s[j] === '\x1b' && s[j + 1] === '\\') return { key: KeyParser.key('osc', { ch: s.slice(i, j + 2) }), next: j + 2 };
    }
    return { incomplete: true, rest: s.slice(i) };
  }

  static _altKey(n) {
    if (n === '\r' || n === '\n') return KeyParser.key('enter', { alt: true });
    if (n === '\x7f' || n === '\b') return KeyParser.key('backspace', { alt: true });
    const code = n.charCodeAt(0);
    if (code < 0x20) return KeyParser.key('ctrl', { ch: String.fromCharCode(code + 96), ctrl: true, alt: true });
    return KeyParser.key('char', { ch: n, alt: true });
  }

  static _csi(s, i) {
    let j = i + 2;
    let params = '';
    while (j < s.length) {
      const c = s.charCodeAt(j);
      if (c >= 0x40 && c <= 0x7e) break;
      params += s[j];
      j++;
    }
    if (j >= s.length) return null;
    const final = s[j];
    const nums = params.split(';').map((p) => parseInt(p, 10));
    return { k: KeyParser._csiKey(final, params, nums), len: j + 1 - i };
  }

  static _csiKey(final, params, nums) {
    if (final === '~') return KeyParser._tildeKey(nums);
    if (final === 'u') return KeyParser._kittyKey(nums);
    if (KeyParser.CSI_FINAL[final]) {
      const mod = params.includes(';') ? nums[1] : (nums[0] > 1 ? nums[0] : 1);
      const k = KeyParser._withMods(KeyParser.key(KeyParser.CSI_FINAL[final]), mod);
      if (final === 'Z') k.shift = true;
      return k;
    }
    if (final === 'I' || final === 'O') return KeyParser.key('focus', { ch: final === 'I' ? 'in' : 'out' });
    return KeyParser.key('unknown');
  }

  static _tildeKey(nums) {
    if (nums[0] === 27 && nums[2]) {
      const code = nums[2];
      if (code === 13) return KeyParser._withMods(KeyParser.key('enter'), nums[1]);
      if (code === 9) return KeyParser._withMods(KeyParser.key('tab'), nums[1]);
      return KeyParser._withMods(KeyParser.key('char', { ch: String.fromCharCode(code) }), nums[1]);
    }
    return KeyParser._withMods(KeyParser.key(KeyParser.CSI_TILDE[nums[0]] || 'unknown'), nums[1]);
  }

  static _kittyKey(nums) {
    const code = nums[0];
    const named = { 13: 'enter', 9: 'tab', 27: 'escape', 127: 'backspace' }[code];
    const k = named ? KeyParser.key(named) : KeyParser.key('char', { ch: String.fromCodePoint(code) });
    return KeyParser._withMods(k, nums[1]);
  }
}

module.exports = KeyParser;
