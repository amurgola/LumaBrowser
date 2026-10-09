const SharingResume = require('../sharing/SharingResume');

class SettledStarts {
  static PLACEMENT_DELAY_MS = 4000;

  constructor(ctx, { log = console, setTimeoutFn = setTimeout } = {}) {
    this._s = ctx.services;
    this._log = log;
    this._setTimeout = setTimeoutFn;
  }

  run() {
    this._s.localApiServer.resume().catch(() => {});
    new SharingResume({
      hostService: this._s.sharingHostService,
      clientService: this._s.sharingClientService,
      notices: this._s.sharingNotices,
      log: this._log,
      setTimeoutFn: this._setTimeout,
    }).schedule();
    this._setTimeout(() => this._autoStartPlacement(), SettledStarts.PLACEMENT_DELAY_MS);
  }

  _autoStartPlacement() {
    return this._s.placementService.maybeAutoStart()
      .catch((e) => this._log.warn('[placement] auto-start failed:', e && e.message));
  }
}

module.exports = SettledStarts;
