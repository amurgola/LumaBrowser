class InputEventMapper {
  static KEY_MAP = {
    Enter: 'Return', Backspace: 'Backspace', Tab: 'Tab', Escape: 'Escape', Delete: 'Delete',
    ArrowLeft: 'Left', ArrowRight: 'Right', ArrowUp: 'Up', ArrowDown: 'Down',
    Home: 'Home', End: 'End', PageUp: 'PageUp', PageDown: 'PageDown', Insert: 'Insert',
    ' ': 'Space', Space: 'Space',
    F1: 'F1', F2: 'F2', F3: 'F3', F4: 'F4', F5: 'F5', F6: 'F6', F7: 'F7', F8: 'F8', F9: 'F9', F10: 'F10', F11: 'F11', F12: 'F12',
  };

  static CLICK_DELAY_MS = 20;
  static KEY_UP_DELAY_MS = 10;
  static TYPE_KEY_UP_DELAY_MS = 8;

  static CHORD_MODIFIERS = new Set(['control', 'alt', 'meta']);

  static toInputEvents(msg, view) {
    if (!msg) return [];
    switch (msg.t) {
      case 'mouse': return InputEventMapper._mouse(msg, view);
      case 'click': return InputEventMapper._click(msg, view);
      case 'wheel': return InputEventMapper._wheel(msg, view);
      case 'key': return InputEventMapper._key(msg);
      case 'text': return InputEventMapper._text(msg);
      default: return [];
    }
  }

  static toViewPoint(nx, ny, view) {
    const w = Math.max(1, Number(view && view.width) || 1);
    const h = Math.max(1, Number(view && view.height) || 1);
    return { x: Math.round(nx * w), y: Math.round(ny * h) };
  }

  static electronKeyCode(key) {
    if (InputEventMapper.KEY_MAP[key]) return InputEventMapper.KEY_MAP[key];
    if (typeof key === 'string' && [...key].length === 1) return key;
    return null;
  }

  static _mouse(msg, view) {
    const { x, y } = InputEventMapper.toViewPoint(msg.x, msg.y, view);
    if (msg.k === 'move') return [{ event: { type: 'mouseMove', x, y } }];
    const type = msg.k === 'down' ? 'mouseDown' : 'mouseUp';
    return [{ event: { type, x, y, button: msg.b, clickCount: msg.cc } }];
  }

  static _click(msg, view) {
    const { x, y } = InputEventMapper.toViewPoint(msg.x, msg.y, view);
    const delay = InputEventMapper.CLICK_DELAY_MS;
    const out = [{ event: { type: 'mouseMove', x, y } }];
    for (let n = 1; n <= msg.cc; n++) {
      out.push({ event: { type: 'mouseDown', x, y, button: msg.b, clickCount: n }, delay });
      out.push({ event: { type: 'mouseUp', x, y, button: msg.b, clickCount: n }, delay });
    }
    return out;
  }

  static _wheel(msg, view) {
    const { x, y } = InputEventMapper.toViewPoint(msg.x, msg.y, view);
    return [{ event: { type: 'mouseWheel', x, y, deltaX: -Math.round(msg.dx), deltaY: -Math.round(msg.dy), canScroll: true } }];
  }

  static _key(msg) {
    const keyCode = InputEventMapper.electronKeyCode(msg.key);
    if (!keyCode) return [];
    const modifiers = msg.mods;
    const out = [
      { event: { type: 'keyDown', keyCode, modifiers } },
      { event: { type: 'keyUp', keyCode, modifiers }, delay: InputEventMapper.KEY_UP_DELAY_MS },
    ];
    if (InputEventMapper._typesText(msg.key, modifiers)) out.splice(1, 0, { event: { type: 'char', keyCode, modifiers } });
    return out;
  }

  static _typesText(key, modifiers) {
    return !InputEventMapper.KEY_MAP[key] && !modifiers.some((m) => InputEventMapper.CHORD_MODIFIERS.has(m));
  }

  static _text(msg) {
    const out = [];
    for (const ch of msg.s) {
      if (ch === '\n' || ch === '\r') {
        out.push({ event: { type: 'keyDown', keyCode: 'Return' } });
        out.push({ event: { type: 'keyUp', keyCode: 'Return' }, delay: InputEventMapper.KEY_UP_DELAY_MS });
        continue;
      }
      out.push({ event: { type: 'keyDown', keyCode: ch } });
      out.push({ event: { type: 'char', keyCode: ch } });
      out.push({ event: { type: 'keyUp', keyCode: ch }, delay: InputEventMapper.TYPE_KEY_UP_DELAY_MS });
    }
    return out;
  }
}

module.exports = InputEventMapper;
