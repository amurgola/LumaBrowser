import Dom from '../dom/Dom.js';
import Dialogs from '../dialogs/Dialogs.js';
import MusicRuntimeMarkup from './MusicRuntimeMarkup.js';

export default class MusicRuntimeCard {
  static UNSUPPORTED = 'Music generation needs an NVIDIA GPU (CUDA 12) and is not supported on this platform.';

  constructor(panel) {
    this._panel = panel;
  }

  paint() {
    const body = Dom.byId('musicRuntimeBody');
    const pill = Dom.byId('musicRuntimePill');
    if (!body) return;
    const view = this._panel.view;
    const row = this._panel.runtimeRow();
    if (!view || !view.platformSupported || !row) { this._paintUnsupported(body, pill); return; }
    const status = view.status || { state: 'idle' };
    if (pill) {
      const [cls, text] = MusicRuntimeMarkup.pill(status.state, row.installed);
      pill.className = 'luma-badge ' + cls;
      pill.textContent = text;
    }
    body.className = '';
    body.innerHTML = MusicRuntimeMarkup.html(row, this._panel.installProgress, status.state === 'ready' || status.state === 'starting');
    this._wire(row);
  }

  _paintUnsupported(body, pill) {
    body.className = '';
    body.textContent = MusicRuntimeCard.UNSUPPORTED;
    if (pill) { pill.className = 'luma-badge'; pill.textContent = 'Unavailable'; }
  }

  _wire(row) {
    const api = this._panel.api();
    this._bind('musicInstallBtn', async () => {
      this._panel.installProgress = { phase: 'starting' };
      this.paint();
      await api.installRuntime(row.id);
    });
    this._bind('musicCancelInstallBtn', () => api.cancelInstall());
    this._bind('musicUninstallBtn', async () => {
      if (!await Dialogs.confirm('Remove the SGLang-Omni environment? The downloaded model stays.')) return;
      await api.uninstallRuntime(row.id);
      this._panel.refreshAll();
    });
    this._bind('musicCheckUpdatesBtn', async () => {
      const result = await api.checkRuntimeUpdates({ force: false });
      if (result && result.success && result.runtimes) { this._panel.view.runtimes = result.runtimes; this.paint(); }
    });
    this._bind('musicStopBtn', async () => { await api.stopServer(); this._panel.refreshStatusOnly(); });
  }

  _bind(id, fn) {
    const el = Dom.byId(id);
    if (el) el.addEventListener('click', fn);
  }
}
