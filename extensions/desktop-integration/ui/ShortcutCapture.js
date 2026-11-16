export default class ShortcutCapture {
  static MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'AltGraph', 'Meta', 'OS']);
  static NAMED = {
    Space: 'Space', Tab: 'Tab', Enter: 'Enter', NumpadEnter: 'Enter', Backspace: 'Backspace', Delete: 'Delete',
    Insert: 'Insert', Home: 'Home', End: 'End', PageUp: 'PageUp', PageDown: 'PageDown',
    ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right', Escape: 'Escape',
  };
  static NEEDS_MODIFIER = 'Add Ctrl or Alt: on its own this key would stop typing in every app.';
  static UNKNOWN_KEY = 'That key cannot be used in a shortcut.';

  static read(event, { mac = false } = {}) {
    const modifiers = ShortcutCapture._modifiers(event, mac);
    if (ShortcutCapture.MODIFIER_KEYS.has(event.key)) return { pending: modifiers.join('+') };
    const key = ShortcutCapture._key(event.code);
    if (!key) return { error: ShortcutCapture.UNKNOWN_KEY };
    const functionKey = /^F\d+$/.test(key);
    const anchored = event.ctrlKey || event.altKey || event.metaKey;
    if (!functionKey && !anchored) return { error: ShortcutCapture.NEEDS_MODIFIER };
    return { accelerator: [...modifiers, key].join('+') };
  }

  static display(accelerator) {
    return String(accelerator || '').split('+').filter(Boolean).join(' + ');
  }

  static _modifiers(event, mac) {
    const held = [];
    if (event.ctrlKey) held.push('Ctrl');
    if (event.metaKey) held.push(mac ? 'Command' : 'Super');
    if (event.altKey) held.push('Alt');
    if (event.shiftKey) held.push('Shift');
    return held;
  }

  static _key(code) {
    const text = String(code || '');
    const letter = /^Key([A-Z])$/.exec(text);
    if (letter) return letter[1];
    const digit = /^Digit(\d)$/.exec(text);
    if (digit) return digit[1];
    if (/^F([1-9]|1\d|2[0-4])$/.test(text)) return text;
    return ShortcutCapture.NAMED[text] || null;
  }
}
