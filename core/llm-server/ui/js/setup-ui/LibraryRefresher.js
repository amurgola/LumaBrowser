export default class LibraryRefresher {
  static DEBOUNCE_MS = 250;

  constructor(ctx) {
    this._ctx = ctx;
    this._timer = null;
    this._withRuntimes = false;
  }

  request(opts) {
    if (opts && opts.runtimes) this._withRuntimes = true;
    if (this._timer) return;
    this._timer = setTimeout(() => this._run(), LibraryRefresher.DEBOUNCE_MS);
  }

  async _run() {
    const withRuntimes = this._withRuntimes;
    this._timer = null;
    this._withRuntimes = false;
    const cards = this._ctx.cards;
    try {
      if (withRuntimes) await cards.runtimes.render();
      await cards.models.render();
      await cards.defaults.render();
    } catch (_) {}
  }
}
