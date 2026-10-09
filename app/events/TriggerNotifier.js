class TriggerNotifier {
  static SETTING_KEY = 'core.triggers.notifyFailures';
  static MAX_BODY_CHARS = 240;
  static OPEN_DELAY_MS = 400;

  constructor({ db, notice, showWindow, openLlmTab, emitOpen, setTimeoutFn = setTimeout }) {
    this._db = db;
    this._notice = notice;
    this._showWindow = showWindow;
    this._openLlmTab = openLlmTab;
    this._emitOpen = emitOpen;
    this._setTimeout = setTimeoutFn;
  }

  notifier() {
    return (args) => this.notify(args);
  }

  notify({ title, body, triggerId } = {}) {
    if (this._db.get(TriggerNotifier.SETTING_KEY, true) === false) return false;
    return this._notice.show({
      title,
      body: String(body || '').slice(0, TriggerNotifier.MAX_BODY_CHARS),
      onClick: () => this._open(triggerId),
    });
  }

  _open(triggerId) {
    try { this._showWindow(); } catch (_) {}
    try { this._openLlmTab(); } catch (_) {}
    this._setTimeout(() => this._emitOpen(triggerId), TriggerNotifier.OPEN_DELAY_MS);
  }
}

module.exports = TriggerNotifier;
