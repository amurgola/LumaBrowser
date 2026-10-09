import PollingHint from './PollingHint.js';

export default class GroupRouterHint extends PollingHint {
  static DOWNLOAD_POLL_MS = 1000;

  static START_POLL_MS = 1500;

  constructor(ctx) {
    super(ctx, 'groupRouterHint');
  }

  static firstLine(text) {
    return String(text).split('\n')[0];
  }

  paint(hint, status) {
    if (!status.enabled) { hint.textContent = ''; return 0; }
    if (status.download) {
      const mb = (b) => Math.round((b || 0) / (1024 * 1024));
      hint.textContent = `Downloading model ${mb(status.download.received)} / ${mb(status.download.total)} MB...`;
      return GroupRouterHint.DOWNLOAD_POLL_MS;
    }
    if (!status.modelInstalled) {
      hint.textContent = status.error ? GroupRouterHint.firstLine(status.error) : 'Preparing model download...';
      return status.error ? 0 : GroupRouterHint.DOWNLOAD_POLL_MS;
    }
    if (status.state === 'ready') {
      hint.textContent = status.lastLatencyMs != null ? `Ready, ${status.lastLatencyMs} ms last message.` : 'Ready.';
      return 0;
    }
    if (status.state === 'error' || status.error) {
      hint.textContent = status.error ? GroupRouterHint.firstLine(status.error) : 'Router failed to start.';
      return 0;
    }
    hint.textContent = 'Starting...';
    return GroupRouterHint.START_POLL_MS;
  }

  _available() {
    return !!(this._ctx.api && this._ctx.api.getGroupRouterStatus);
  }

  async _fetch() {
    const r = await this._ctx.api.getGroupRouterStatus();
    return r && r.success ? r.status : null;
  }
}
