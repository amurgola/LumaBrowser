const InputDriver = require('../InputDriver');

class KeyInput {
  static KEY_GAP_MS = 10;
  static CHAR_GAP_MS = 12;
  static DRAG_STEPS = 8;

  static async trustedKey(wc, keyCode, modifiers = []) {
    wc.sendInputEvent({ type: 'keyDown', keyCode, modifiers });
    await KeyInput.sleep(KeyInput.KEY_GAP_MS);
    wc.sendInputEvent({ type: 'keyUp', keyCode, modifiers });
    await KeyInput.sleep(KeyInput.KEY_GAP_MS);
  }

  static async trustedType(wc, text) {
    for (const ch of String(text)) {
      wc.sendInputEvent({ type: 'keyDown', keyCode: ch });
      wc.sendInputEvent({ type: 'char', keyCode: ch });
      wc.sendInputEvent({ type: 'keyUp', keyCode: ch });
      await KeyInput.sleep(KeyInput.CHAR_GAP_MS);
    }
  }

  static async trustedClearField(wc, platform = process.platform) {
    await KeyInput.trustedKey(wc, 'A', [platform === 'darwin' ? 'meta' : 'control']);
    await KeyInput.trustedKey(wc, 'Backspace');
  }

  static async trustedDrag(wc, from, to, { steps = KeyInput.DRAG_STEPS } = {}) {
    const a = InputDriver.toDip(wc, from.x, from.y);
    const b = InputDriver.toDip(wc, to.x, to.y);
    await KeyInput._press(wc, a);
    await KeyInput._moveInSteps(wc, a, b, steps);
    wc.sendInputEvent({ type: 'mouseUp', x: b.x, y: b.y, button: 'left', clickCount: 1 });
    await KeyInput.sleep(20);
  }

  static sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static async _press(wc, point) {
    wc.sendInputEvent({ type: 'mouseMove', x: point.x, y: point.y });
    await KeyInput.sleep(20);
    wc.sendInputEvent({ type: 'mouseDown', x: point.x, y: point.y, button: 'left', clickCount: 1 });
    await KeyInput.sleep(30);
  }

  static async _moveInSteps(wc, a, b, steps) {
    for (let i = 1; i <= steps; i++) {
      const x = Math.round(a.x + ((b.x - a.x) * i) / steps);
      const y = Math.round(a.y + ((b.y - a.y) * i) / steps);
      wc.sendInputEvent({ type: 'mouseMove', x, y, modifiers: ['leftButtonDown'] });
      await KeyInput.sleep(16);
    }
  }
}

module.exports = KeyInput;
