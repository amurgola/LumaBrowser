const KeyInput = require('./KeyInput');
const FieldScripts = require('./FieldScripts');
const WidgetPage = require('./WidgetPage');

class SliderKeyDriver {
  static MAX_KEYS = 300;
  static PAGE_TRIP_STEPS = 20;
  static MAX_BATCH = 25;
  static MAX_BATCHES = 40;
  static UP_KEY = 'Right';
  static DOWN_KEY = 'Left';

  constructor(wc, info, target) {
    this._wc = wc;
    this._info = info;
    this._target = target;
    this._now = info.now;
    this._presses = 0;
  }

  async execute() {
    const focused = await WidgetPage.run(this._wc, FieldScripts.focusTargetScript());
    if (!focused.success) return { moved: false, now: this._info.now };
    if (this._target <= this._info.min) return this._jump('Home');
    if (this._target >= this._info.max) return this._jump('End');
    const step = await this._learnStep();
    if (!step) return { moved: false, now: this._now, presses: this._presses };
    await this._pageCloser(step);
    await this._arrowTheRest(step);
    return { moved: true, now: this._now, presses: this._presses, step };
  }

  async _jump(key) {
    await this._press(key);
    return { moved: true, now: await this._read(), presses: this._presses };
  }

  async _learnStep() {
    if (this._now == null) this._now = this._info.min;
    const before = this._now;
    await this._press(this._towards());
    const after = await this._read();
    if (after == null || after === before) {
      this._now = after;
      return null;
    }
    this._now = after;
    return Math.abs(after - before);
  }

  async _pageCloser(step) {
    if (Math.abs(this._target - this._now) / step <= SliderKeyDriver.PAGE_TRIP_STEPS) return;
    const pageKey = this._target > this._now ? 'PageUp' : 'PageDown';
    await this._press(pageKey);
    const after = await this._read();
    const pageStep = after != null ? Math.abs(after - this._now) : 0;
    if (after != null) this._now = after;
    if (pageStep <= step) return;
    const pages = Math.floor(Math.abs(this._target - this._now) / pageStep);
    const key = this._target > this._now ? 'PageUp' : 'PageDown';
    for (let i = 0; i < pages && this._underKeyBudget(); i++) await this._press(key);
    this._now = await this._read();
  }

  async _arrowTheRest(step) {
    for (let batch = 0; batch < SliderKeyDriver.MAX_BATCHES && this._now != null && this._underKeyBudget(); batch++) {
      const remaining = this._target - this._now;
      if (Math.abs(remaining) <= step / 2) break;
      const count = Math.max(1, Math.min(SliderKeyDriver.MAX_BATCH, Math.round(Math.abs(remaining) / step)));
      const key = remaining > 0 ? SliderKeyDriver.UP_KEY : SliderKeyDriver.DOWN_KEY;
      for (let i = 0; i < count && this._underKeyBudget(); i++) await this._press(key);
      const next = await this._read();
      if (next === this._now) break;
      this._now = next;
    }
  }

  _towards() {
    return this._target > this._now ? SliderKeyDriver.UP_KEY : SliderKeyDriver.DOWN_KEY;
  }

  _underKeyBudget() {
    return this._presses < SliderKeyDriver.MAX_KEYS;
  }

  async _press(key) {
    await KeyInput.trustedKey(this._wc, key);
    this._presses++;
  }

  async _read() {
    const read = await WidgetPage.run(this._wc, FieldScripts.readValueScript());
    return read.success ? read.now : null;
  }
}

module.exports = SliderKeyDriver;
