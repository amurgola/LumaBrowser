class DesktopKeys {
  static NAMED_KEYS = {
    backspace: 0x08, tab: 0x09, enter: 0x0d, return: 0x0d, shift: 0x10, ctrl: 0x11, control: 0x11,
    alt: 0x12, pause: 0x13, capslock: 0x14, escape: 0x1b, esc: 0x1b, space: 0x20,
    pageup: 0x21, pagedown: 0x22, end: 0x23, home: 0x24,
    left: 0x25, arrowleft: 0x25, up: 0x26, arrowup: 0x26, right: 0x27, arrowright: 0x27, down: 0x28, arrowdown: 0x28,
    printscreen: 0x2c, insert: 0x2d, delete: 0x2e, del: 0x2e,
    win: 0x5b, meta: 0x5b, cmd: 0x5b, super: 0x5b, menu: 0x5d, apps: 0x5d,
    numlock: 0x90, scrolllock: 0x91,
    ';': 0xba, '=': 0xbb, ',': 0xbc, '-': 0xbd, '.': 0xbe, '/': 0xbf, '`': 0xc0, '[': 0xdb, '\\': 0xdc, ']': 0xdd, "'": 0xde,
  };

  static VK = DesktopKeys._buildVirtualKeyTable();

  static EXTENDED = new Set([0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x2d, 0x2e, 0x5b, 0x5d, 0x90]);

  static parseCombo(combo) {
    const parts = String(combo || '').toLowerCase().split('+').map((s) => s.trim()).filter(Boolean);
    if (!parts.length) throw new Error('keys is empty');
    return parts.map(DesktopKeys._virtualKeyFor);
  }

  static comboEvents(combo) {
    const vks = DesktopKeys.parseCombo(combo);
    const down = vks.map((vk) => DesktopKeys._event(vk, false));
    const up = [...vks].reverse().map((vk) => DesktopKeys._event(vk, true));
    return [...down, ...up];
  }

  static _virtualKeyFor(name) {
    const vk = DesktopKeys.VK[name];
    if (vk == null) throw new Error(`Unknown key "${name}". Use names like ctrl, shift, alt, win, enter, tab, esc, f5, a-z, 0-9, arrows.`);
    return vk;
  }

  static _event(vk, up) {
    return { vk, up, extended: DesktopKeys.EXTENDED.has(vk) };
  }

  static _buildVirtualKeyTable() {
    const table = { ...DesktopKeys.NAMED_KEYS };
    for (let i = 1; i <= 24; i++) table[`f${i}`] = 0x6f + i;
    for (let c = 0; c < 26; c++) table[String.fromCharCode(97 + c)] = 0x41 + c;
    for (let d = 0; d <= 9; d++) table[String(d)] = 0x30 + d;
    return table;
  }
}

module.exports = DesktopKeys;
