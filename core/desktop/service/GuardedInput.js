class GuardedInput {
  constructor({ win, guards, control = null }) {
    this._win = win;
    this._guards = guards;
    this._control = control;
  }

  send(w, inputs) {
    if (this._control) this._control.check();
    const popup = this._guards.checkForeground(w);
    if (popup) w.popupInFront = popup;
    try {
      return this._win.sendInputs(inputs);
    } catch (e) {
      const human = this._guards.humanNeeded();
      if (human) throw human;
      throw e;
    }
  }

  release(inputs) {
    try { this._win.sendInputs(inputs); } catch (_) {}
  }

  buttonFlags(button) {
    const F = this._win.MOUSEEVENTF;
    if (button === 'right') return { down: F.RIGHTDOWN, up: F.RIGHTUP };
    if (button === 'middle') return { down: F.MIDDLEDOWN, up: F.MIDDLEUP };
    return { down: F.LEFTDOWN, up: F.LEFTUP };
  }
}

module.exports = GuardedInput;
