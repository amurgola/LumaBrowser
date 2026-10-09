const InputDriver = require('../InputDriver');
const KeyInput = require('./KeyInput');
const ListScripts = require('./ListScripts');
const WidgetPage = require('./WidgetPage');
const ListRowLedger = require('./ListRowLedger');

class ListCollector {
  static DEFAULT_MAX_ITEMS = 200;
  static MAX_ITEMS_CAP = 2000;
  static DEFAULT_MAX_SCROLLS = 30;
  static MAX_SCROLLS_CAP = 200;
  static DEFAULT_SETTLE_MS = 1500;
  static MIN_SETTLE_MS = 200;
  static POLL_MS = 150;
  static SHORT_WAIT_MS = 300;
  static IDLE_ROUNDS_TO_STOP = 2;

  constructor(wc) {
    this._wc = wc;
    this._ledger = new ListRowLedger();
    this._scrolls = 0;
    this._idle = 0;
    this._loadMoreClicks = 0;
    this._stoppedBecause = null;
  }

  async execute(opts = {}) {
    if (!opts.itemSelector) return { success: false, error: 'itemSelector is required' };
    this._setupFromOptions(opts);
    const first = await this._readStep();
    if (!first.success) return first;
    if (first.total === 0) return { success: false, error: `No items match "${opts.itemSelector}" on this page` };
    this._ledger.absorb(first);
    this._container = first.container;
    const failure = await this._walk();
    return failure || this._result();
  }

  _setupFromOptions(opts) {
    this._itemSelector = opts.itemSelector;
    this._maxItems = Math.max(1, Math.min(ListCollector.MAX_ITEMS_CAP, Number(opts.maxItems) || ListCollector.DEFAULT_MAX_ITEMS));
    const maxScrolls = opts.maxScrolls == null ? ListCollector.DEFAULT_MAX_SCROLLS : Number(opts.maxScrolls) || 0;
    this._maxScrolls = Math.max(0, Math.min(ListCollector.MAX_SCROLLS_CAP, maxScrolls));
    this._settleMs = Math.max(ListCollector.MIN_SETTLE_MS, Number(opts.settleMs) || ListCollector.DEFAULT_SETTLE_MS);
    this._stepScript = ListScripts.collectListStepScript({ itemSelector: opts.itemSelector, childSelectors: opts.childSelectors });
  }

  async _readStep() {
    this._step = await WidgetPage.run(this._wc, this._stepScript);
    return this._step;
  }

  async _walk() {
    while (!this._stoppedBecause) {
      if (this._ledger.size >= this._maxItems) return this._stop('maxItems');
      if (this._scrolls >= this._maxScrolls) return this._stop('maxScrolls');
      const advanced = await this._advance();
      if (advanced.failure) return advanced.failure;
      if (advanced.ended) return this._stop('endOfList');
      this._scrolls++;
      const settled = await this._settle();
      if (settled.failure) return settled.failure;
      this._noteProgress(settled.added);
    }
    return null;
  }

  _stop(reason) {
    this._stoppedBecause = reason;
    return null;
  }

  async _advance() {
    if (this._atEnd() && (await this._clickLoadMore())) return {};
    const scrolled = await WidgetPage.run(this._wc, ListScripts.scrollListScript({ itemSelector: this._itemSelector }));
    if (!scrolled.success) return { failure: scrolled };
    this._container = scrolled.container;
    return { ended: !scrolled.moved && this._idle > 0 };
  }

  async _clickLoadMore() {
    const more = await WidgetPage.run(this._wc, ListScripts.findLoadMoreScript({ itemSelector: this._itemSelector }));
    if (!more.success || !more.found) return false;
    if (more.occluded) await WidgetPage.run(this._wc, ListScripts.clickLoadMoreScript());
    else await InputDriver.trustedClick(this._wc, more.x, more.y);
    this._loadMoreClicks++;
    return true;
  }

  async _settle() {
    const started = Date.now();
    for (;;) {
      await KeyInput.sleep(ListCollector.POLL_MS);
      const step = await this._readStep();
      if (!step.success) return { failure: step };
      const added = this._ledger.absorb(step);
      if (added > 0) return { added };
      const waited = Date.now() - started;
      if (!this._atEnd() && waited >= ListCollector.SHORT_WAIT_MS) return { added };
      if (waited >= this._settleMs) return { added };
    }
  }

  _noteProgress(added) {
    if (added > 0) {
      this._idle = 0;
      return;
    }
    if (!this._atEnd()) return;
    this._idle++;
    if (this._idle >= ListCollector.IDLE_ROUNDS_TO_STOP) this._stoppedBecause = this._step.atBottom ? 'endOfList' : 'noNewItems';
  }

  _atEnd() {
    return !!(this._step.atBottom || this._step.endVisible);
  }

  _result() {
    const rows = this._ledger.rows();
    const truncated = rows.length > this._maxItems;
    const kept = rows.slice(0, this._maxItems);
    return {
      success: true,
      data: {
        items: kept.map((r) => r.fields),
        count: kept.length,
        scrolls: this._scrolls,
        stoppedBecause: truncated ? 'maxItems' : this._stoppedBecause,
        mode: this._ledger.virtualized ? 'virtualized' : 'append',
        container: this._container,
        loadMoreClicks: this._loadMoreClicks,
      },
    };
  }
}

module.exports = ListCollector;
