class GameMacroRunner {
  static MAX_WAIT_MS = 10000;

  constructor({ controller, sleep }) {
    this._controller = controller;
    this._sleep = sleep;
  }

  async run(name, steps, hwnd) {
    for (let i = 0; i < steps.length; i++) {
      const r = await this._runStep(steps[i], { hwnd });
      if (!r.success) return { success: false, error: `Macro "${name}" stopped at step ${i + 1}: ${r.error}` };
    }
    return { success: true };
  }

  _runStep(step, hw) {
    const c = this._controller;
    if (step.press != null) return c.pressKeys({ ...hw, keys: step.press, holdMs: step.holdMs, gapMs: step.gapMs, mode: step.mode });
    if (step.hold != null) return c.holdKey({ ...hw, key: step.hold, ms: step.ms, mode: step.mode });
    if (step.mouse != null) return c.moveMouseRelative({ ...hw, dx: step.mouse.dx, dy: step.mouse.dy, durationMs: step.mouse.durationMs });
    if (step.click != null) return c.clickUI({ ...step.click, ...hw });
    if (step.wait === 'still') return c.waitForStill({ ...hw, timeoutMs: step.timeoutMs });
    if (step.wait === 'change') return c.waitForChange({ ...hw, timeoutMs: step.timeoutMs });
    return this._pause(step.wait);
  }

  async _pause(ms) {
    await this._sleep(Math.min(GameMacroRunner.MAX_WAIT_MS, Number(ms) || 0));
    return { success: true };
  }
}

module.exports = GameMacroRunner;
