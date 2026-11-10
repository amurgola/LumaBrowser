import PollingHint from './PollingHint.js';

export default class HelperModelHint extends PollingHint {
  static START_POLL_MS = 1500;

  constructor(ctx) {
    super(ctx, 'helperModelHint');
  }

  static firstLine(text) {
    return String(text).split('\n')[0];
  }

  paint(hint, status) {
    if (!status.enabled) { hint.textContent = ''; return 0; }
    if (!status.modelInstalled) {
      hint.textContent = status.modelPath ? 'Model file not found.' : 'Pick a model file below.';
      return 0;
    }
    if (status.state === 'ready') {
      hint.textContent = 'Ready as ' + (status.ref || 'helper') + (status.device != null && status.device !== '' ? ' on GPU ' + status.device : '') + '.';
      return 0;
    }
    if (status.state === 'error' || status.error) {
      hint.textContent = status.error ? HelperModelHint.firstLine(status.error) : 'Helper failed to start.';
      return 0;
    }
    hint.textContent = 'Loading...';
    return HelperModelHint.START_POLL_MS;
  }

  _available() {
    return !!(this._ctx.api && this._ctx.api.getHelperModelStatus);
  }

  async _fetch() {
    const r = await this._ctx.api.getHelperModelStatus();
    return r && r.success ? r.status : null;
  }
}
