const InputDriver = require('../InputDriver');
const KeyInput = require('./KeyInput');
const OptionMatcher = require('./OptionMatcher');
const SelectScripts = require('./SelectScripts');
const WidgetPage = require('./WidgetPage');

class DropdownOptions {
  static WAIT_TIMEOUT_MS = 1500;
  static WAIT_INTERVAL_MS = 120;
  static MAX_SCROLLS = 60;
  static SCROLL_SETTLE_MS = 80;

  static OPEN_TARGET_SCRIPT = `(function(){ var t = document.querySelector('[data-luma-widget-target]'); if (t) { try { t.focus(); } catch (_) {} t.click(); } return { success: true }; })()`;

  constructor(wc) {
    this._wc = wc;
  }

  async open(info) {
    if (info.occluded) await WidgetPage.run(this._wc, DropdownOptions.OPEN_TARGET_SCRIPT);
    else await InputDriver.trustedClick(this._wc, info.x, info.y);
  }

  list() {
    return WidgetPage.run(this._wc, SelectScripts.collectOptionsScript());
  }

  async waitForOptions({ timeoutMs = DropdownOptions.WAIT_TIMEOUT_MS, interval = DropdownOptions.WAIT_INTERVAL_MS } = {}) {
    const deadline = Date.now() + timeoutMs;
    let last = { success: true, options: [], popupCount: 0 };
    do {
      last = await this.list();
      if (!last.success || last.options.length) return last;
      await KeyInput.sleep(interval);
    } while (Date.now() < deadline);
    return last;
  }

  async find(listed, wanted, { maxScrolls = DropdownOptions.MAX_SCROLLS } = {}) {
    const scan = await this._scanForward(listed, wanted, maxScrolls);
    let hit = scan.hit;
    if (scan.best && (!hit || hit.score < scan.best.score)) hit = await this._rewindTo(scan.best, scan.scrolled);
    return { hit, allOptions: [...scan.seen.values()] };
  }

  async click(index) {
    const point = await WidgetPage.run(this._wc, SelectScripts.optionPointScript(index));
    if (!point.success) return point;
    if (point.occluded) {
      const synthetic = await WidgetPage.run(this._wc, SelectScripts.syntheticOptionClickScript(index));
      return { ...synthetic, method: 'synthetic' };
    }
    await InputDriver.trustedClick(this._wc, point.x, point.y);
    return { success: true, method: 'input' };
  }

  async _scanForward(listed, wanted, maxScrolls) {
    const seen = new Map(listed.options.map((o) => [o.label, o]));
    let hit = OptionMatcher.pickOption(listed.options, wanted);
    let best = hit;
    let scrolled = 0;
    while (!DropdownOptions._isExact(hit) && scrolled < maxScrolls) {
      if (!(await this._scrollOnce())) break;
      scrolled++;
      await KeyInput.sleep(DropdownOptions.SCROLL_SETTLE_MS);
      const again = await this.list();
      if (!again.success) break;
      for (const o of again.options) if (!seen.has(o.label)) seen.set(o.label, o);
      hit = OptionMatcher.pickOption(again.options, wanted);
      if (hit && (!best || hit.score > best.score)) best = hit;
    }
    return { hit, best, scrolled, seen };
  }

  async _rewindTo(best, scrolled) {
    await WidgetPage.run(this._wc, SelectScripts.scrollOptionsScript({ toTop: true }));
    for (let i = 0; i <= scrolled; i++) {
      if (i > 0 && !(await this._scrollOnce())) return null;
      await KeyInput.sleep(DropdownOptions.SCROLL_SETTLE_MS);
      const again = await this.list();
      if (!again.success) return null;
      const current = again.options.find((o) => o.label === best.option.label && !o.disabled);
      if (current) return { option: current, score: best.score };
    }
    return null;
  }

  async _scrollOnce() {
    const scrolled = await WidgetPage.run(this._wc, SelectScripts.scrollOptionsScript());
    return !!(scrolled.success && scrolled.moved);
  }

  static _isExact(hit) {
    return !!hit && hit.score >= OptionMatcher.EXACT_LABEL_SCORE;
  }
}

module.exports = DropdownOptions;
