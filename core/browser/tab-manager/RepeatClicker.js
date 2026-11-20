const ElementClicker = require('./ElementClicker');
const RepeatClickScripts = require('./RepeatClickScripts');

class RepeatClicker {
  static POLL_MS = 500;
  static DEFAULT_INTERVAL_SECONDS = 3;
  static MIN_INTERVAL_SECONDS = 1;
  static DEFAULT_TIMEOUT_SECONDS = 300;
  static MAX_TIMEOUT_SECONDS = 3600;
  static START_WAIT_MS = 5000;
  static STUCK_MS = 15000;
  static MAX_RELOADS_IN_A_ROW = 3;
  static LOAD_WAIT_MS = 15000;
  static NAVIGATION_SETTLE_MS = 1500;

  static TARGET_REQUIRED = 'text (the label of the link or button to click) or selector is required';
  static UNTIL_REQUIRED = 'a stop condition is required: untilText, untilSelector or untilUrl';
  static NO_TARGET = 'No visible link or button matching the target is on the page right now, so nothing was clicked. '
    + 'Check the label with observe_page; if the page is stuck loading, navigate to its URL again first.';
  static ALREADY_TRUE = 'The stop condition already holds on this page before any click, so it cannot tell the wanted '
    + 'state from the current one and nothing was clicked. Choose text, an element or an address that is ONLY there '
    + 'once the page has moved on (read the page with get_source to pick one).';

  static NOTES = {
    reached: 'The stop condition holds now. Look at the page before acting on it: the refs you had are stale.',
    navigated: 'The tab left the page it started on before the stop condition showed. Look at the page to see where it landed.',
    timeout: 'Not reached yet. Call click_until again with the same arguments to keep going.',
    stopped: 'Stopped by the user.',
    target_gone: 'The target has not come back after the starting page was loaded again several times. Look at the page to see what changed.',
  };

  static ALERTING = new Set(['reached', 'navigated', 'target_gone']);

  static async run(page, options = {}, deps = {}) {
    const refusal = RepeatClicker._refusal(options);
    if (refusal) return { success: false, error: refusal };
    return new RepeatClicker(page, options, deps)._run();
  }

  static alertFor(data) {
    if (!data || !RepeatClicker.ALERTING.has(data.outcome)) return null;
    const clicks = `${data.clicks} click${data.clicks === 1 ? '' : 's'}`;
    if (data.outcome === 'reached') return { title: 'LumaBrowser: the page is ready', body: `The page reached the state you were waiting for after ${clicks}.` };
    if (data.outcome === 'navigated') return { title: 'LumaBrowser: the page moved on', body: `After ${clicks} the tab went to ${data.url}` };
    return { title: 'LumaBrowser: the click loop stopped', body: `What it was clicking is no longer on the page (${clicks}).` };
  }

  constructor(page, options, deps) {
    this._page = page;
    this._probeScript = RepeatClickScripts.probe(options);
    this._intervalMs = RepeatClicker._seconds(options.intervalSeconds, RepeatClicker.DEFAULT_INTERVAL_SECONDS, RepeatClicker.MIN_INTERVAL_SECONDS, RepeatClicker.MAX_TIMEOUT_SECONDS) * 1000;
    this._timeoutMs = RepeatClicker._seconds(options.timeoutSeconds, RepeatClicker.DEFAULT_TIMEOUT_SECONDS, 1, RepeatClicker.MAX_TIMEOUT_SECONDS) * 1000;
    this._shouldStop = typeof deps.shouldStop === 'function' ? deps.shouldStop : () => false;
    this._sleep = deps.sleep || RepeatClicker._sleep;
    this._now = deps.now || Date.now;
    this._clicks = 0;
    this._reloads = 0;
    this._reloadsInARow = 0;
  }

  async _run() {
    this._begin();
    const refusal = await this._startRefusal();
    if (refusal) return { success: false, error: refusal };
    const end = await this._loop();
    return { success: true, data: this._report(end) };
  }

  _begin() {
    this._startedAt = this._now();
    this._deadline = this._startedAt + this._timeoutMs;
    this._lastSeenAt = this._startedAt;
    this._nextClickAt = this._startedAt;
    this._startUrl = this._page.url();
    this._startPage = RepeatClicker._pageOf(this._startUrl);
  }

  async _startRefusal() {
    const probe = await this._firstLook();
    if (probe.error) return probe.error;
    if (probe.until) return RepeatClicker.ALREADY_TRUE;
    return probe.target ? null : RepeatClicker.NO_TARGET;
  }

  async _firstLook() {
    const giveUpAt = this._now() + RepeatClicker.START_WAIT_MS;
    let probe = await this._probe();
    while (!probe.error && !probe.until && !probe.target && this._now() < giveUpAt) {
      await this._sleep(RepeatClicker.POLL_MS);
      probe = await this._probe();
    }
    return probe;
  }

  async _loop() {
    while (this._now() < this._deadline) {
      if (this._shouldStop()) return { outcome: 'stopped' };
      const end = await this._step();
      if (end) return end;
      await this._sleep(RepeatClicker.POLL_MS);
    }
    return { outcome: 'timeout' };
  }

  async _step() {
    if (this._leftStartPage()) return this._afterNavigation();
    const probe = await this._probe();
    if (probe.until) return { outcome: 'reached', matched: probe.until };
    return probe.target ? this._clickWhenDue() : this._reloadWhenStuck();
  }

  async _afterNavigation() {
    await this._untilLoaded();
    const probe = await this._probe();
    if (probe.until) return { outcome: 'reached', matched: probe.until };
    return this._leftStartPage() ? { outcome: 'navigated' } : null;
  }

  async _clickWhenDue() {
    this._lastSeenAt = this._now();
    this._reloadsInARow = 0;
    if (this._now() < this._nextClickAt) return null;
    const clicked = await ElementClicker.click(this._page, { selector: RepeatClickScripts.TARGET_SELECTOR });
    if (clicked.success) this._clicks += 1;
    this._nextClickAt = this._now() + this._intervalMs;
    return null;
  }

  async _reloadWhenStuck() {
    if (this._now() - this._lastSeenAt < RepeatClicker.STUCK_MS) return null;
    if (this._reloadsInARow >= RepeatClicker.MAX_RELOADS_IN_A_ROW) return { outcome: 'target_gone' };
    await this._reload();
    return null;
  }

  async _reload() {
    this._reloads += 1;
    this._reloadsInARow += 1;
    try { await this._page.tabViewManager.navigate(this._page.tabId, this._startUrl); } catch (_) {}
    this._lastSeenAt = this._now();
  }

  async _probe() {
    let answer = null;
    try { answer = await this._page.run(this._probeScript); } catch (_) { answer = null; }
    if (!answer) return { target: false, until: null };
    if (answer.success === false) return { target: false, until: null, error: answer.error || 'could not read the page' };
    return answer;
  }

  _leftStartPage() {
    return RepeatClicker._pageOf(this._page.url()) !== this._startPage;
  }

  async _untilLoaded() {
    const wc = this._page.webContents;
    const giveUpAt = this._now() + RepeatClicker.LOAD_WAIT_MS;
    while (typeof wc.isLoading === 'function' && wc.isLoading() && this._now() < giveUpAt) await this._sleep(RepeatClicker.POLL_MS);
    await this._sleep(RepeatClicker.NAVIGATION_SETTLE_MS);
  }

  _report(end) {
    return {
      outcome: end.outcome,
      reached: end.outcome === 'reached',
      matched: end.matched || null,
      clicks: this._clicks,
      reloads: this._reloads,
      seconds: Math.round((this._now() - this._startedAt) / 1000),
      url: this._page.url(),
      note: RepeatClicker.NOTES[end.outcome],
    };
  }

  static _refusal(options) {
    if (!options.text && !options.selector) return RepeatClicker.TARGET_REQUIRED;
    if (!options.untilText && !options.untilSelector && !options.untilUrl) return RepeatClicker.UNTIL_REQUIRED;
    return null;
  }

  static _pageOf(url) {
    try {
      const parsed = new URL(url);
      return parsed.origin + parsed.pathname;
    } catch (_) {
      return String(url || '');
    }
  }

  static _seconds(value, fallback, min, max) {
    const seconds = Number(value);
    if (!Number.isFinite(seconds) || seconds <= 0) return fallback;
    return Math.min(max, Math.max(min, seconds));
  }

  static _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = RepeatClicker;
