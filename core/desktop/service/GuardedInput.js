class GuardedInput {
  constructor({ win, guards }) {
    this._win = win;
    this._guards = guards;
  }

  send(w, inputs) {
    this._guards.checkForeground(w);
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
