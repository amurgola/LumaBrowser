import Dialogs from '../../../llm-server/ui/js/dialogs/Dialogs.js';

export default class UpdateControls {
  static INSTALL_CHANNEL = 'core.app.installUpdate';

  static BUSY_STATES = ['checking', 'downloading', 'available'];

  constructor(hooks) {
    this._hooks = hooks;
    this._el = {};
  }

  static describe(state, detail) {
    switch (state) {
      case 'checking': return UpdateControls._line('Checking for updates...', 'busy');
      case 'up-to-date': return UpdateControls._line('You are on the latest version.', 'ok');
      case 'available': return UpdateControls._line(detail ? `Update v${detail} found. Downloading...` : 'Update found. Downloading...', 'busy');
      case 'downloading': {
        const pct = detail && typeof detail.percent === 'number' ? detail.percent : 0;
        return { ...UpdateControls._line(`Downloading update: ${pct}%`, 'busy'), progress: pct };
      }
      case 'downloaded': return { ...UpdateControls._line(detail ? `Version ${detail} is ready to install.` : 'The update is ready to install.', 'ok'), install: true };
      case 'error': return UpdateControls._line(detail ? `Update check failed: ${detail}` : 'Update check failed. Try again later.', 'bad');
      case 'docker': return UpdateControls._line('Updates are managed via the container image.', '');
      default: return UpdateControls._line(detail || '', '');
    }
  }

  static _line(text, dot) {
    return { text, dot, progress: null, install: false };
  }

  async wire() {
    const api = window.electronAPI;
    this._findElements();
    if (!api || !this._el.toggle || !this._el.btn) return;
    await this._wireAutoCheck(api);
    if (api.onUpdateStatus) api.onUpdateStatus((payload) => this._onStatus(payload));
    this._el.btn.addEventListener('click', () => this._checkNow(api));
    if (this._el.installBtn) this._el.installBtn.addEventListener('click', () => this._install());
  }

  _findElements() {
    const byId = (id) => document.getElementById(id);
    this._el = {
      toggle: byId('aboutAutoUpdateToggle'),
      btn: byId('aboutCheckUpdatesBtn'),
      status: byId('aboutUpdateStatus'),
      statusRow: byId('aboutUpdateStatusRow'),
      dot: byId('aboutUpdateDot'),
      progress: byId('aboutUpdateProgress'),
      progressFill: byId('aboutUpdateProgressFill'),
      installBtn: byId('aboutInstallUpdateBtn'),
    };
  }

  async _wireAutoCheck(api) {
    const toggle = this._el.toggle;
    try {
      if (api.getAutoCheckUpdates) toggle.checked = !!(await api.getAutoCheckUpdates());
    } catch {}
    toggle.addEventListener('change', async () => {
      if (!api.setAutoCheckUpdates) return;
      try {
        await api.setAutoCheckUpdates(toggle.checked);
        this._hooks.markSaved(toggle, true);
      } catch (e) {
        toggle.checked = !toggle.checked;
        this._hooks.markSaved(toggle, false, e.message);
      }
    });
  }

  _onStatus(payload) {
    const state = payload && payload.status;
    if (state) this.setState(state, payload.detail);
  }

  setState(state, detail) {
    const el = this._el;
    if (!el.statusRow) return;
    const line = UpdateControls.describe(state, detail);
    el.statusRow.style.display = state === 'idle' ? 'none' : 'flex';
    UpdateControls._show(el.progress, line.progress !== null);
    UpdateControls._show(el.installBtn, line.install);
    if (line.progress !== null && el.progressFill) el.progressFill.style.width = `${line.progress}%`;
    if (el.status) el.status.textContent = line.text;
    if (el.dot) el.dot.className = line.dot ? `luma-dot ${line.dot}` : 'luma-dot';
    el.btn.disabled = UpdateControls.BUSY_STATES.includes(state);
  }

  static _show(el, on) {
    if (el) el.style.display = on ? '' : 'none';
  }

  async _checkNow(api) {
    if (!api.checkForUpdates) return;
    this.setState('checking');
    const res = await api.checkForUpdates();
    if (res && res.ok === false) {
      this.setState(res.reason === 'docker' ? 'docker' : 'error', res.reason === 'docker' ? '' : (res.reason || ''));
    }
  }

  async _install() {
    const ok = await Dialogs.confirm('Restart LumaBrowser now to install the update?', { okLabel: 'Restart and install' });
    if (!ok) return;
    try {
      const r = await window.ipcBridge.invoke(UpdateControls.INSTALL_CHANNEL);
      if (r && r.ok === false) this.setState('error', r.reason || 'Could not start the installer');
    } catch (e) { this.setState('error', e.message); }
  }
}
