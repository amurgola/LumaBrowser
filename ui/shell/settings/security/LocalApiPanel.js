export default class LocalApiPanel {
  static DEFAULT_PORT = 8317;

  constructor({ feedback }) {
    this._feedback = feedback;
  }

  install() {
    this._api = window.localApiAPI;
    const settingsBtn = document.getElementById('settingsBtn');
    this._toggle = document.getElementById('gsLocalApiEnabled');
    if (!this._api || !settingsBtn || !this._toggle) return;
    this._port = document.getElementById('gsLocalApiPort');
    this._status = document.getElementById('gsLocalApiStatus');
    this._urlText = document.getElementById('gsLocalApiUrlText');
    this._errorRow = document.getElementById('gsLocalApiErrorRow');
    this._error = document.getElementById('gsLocalApiError');
    this._toggle.addEventListener('change', () => this._saveEnabled());
    if (this._port) this._port.addEventListener('change', () => this._savePort());
    settingsBtn.addEventListener('click', () => this.load());
    this.load();
  }

  async load() {
    try { this.apply(await this._api.getConfig()); } catch (e) { console.error('local api load failed:', e); }
  }

  apply(cfg) {
    if (!cfg) return;
    this._toggle.checked = !!cfg.enabled;
    if (this._port && document.activeElement !== this._port) this._port.value = cfg.port || LocalApiPanel.DEFAULT_PORT;
    if (this._urlText) this._urlText.textContent = cfg.baseUrl || `http://127.0.0.1:${cfg.port || LocalApiPanel.DEFAULT_PORT}/v1`;
    if (this._status) LocalApiPanel._applyStatus(this._status, cfg);
    if (this._errorRow && this._error) {
      this._errorRow.style.display = cfg.error ? '' : 'none';
      this._error.textContent = cfg.error || '';
    }
  }

  static _applyStatus(el, cfg) {
    if (cfg.running && cfg.modelLoaded) {
      el.textContent = `Live, serving ${cfg.model}`;
      el.style.color = 'var(--good)';
    } else if (cfg.running) {
      el.textContent = 'Listening. No model loaded yet, requests get a 503 until one starts.';
      el.style.color = 'var(--text-muted)';
    } else {
      el.textContent = '';
    }
  }

  async _saveEnabled() {
    const r = await this._api.setEnabled(this._toggle.checked);
    if (r && r.success === false) {
      this._toggle.checked = false;
      this._feedback.markSaved(this._toggle, false, r.error || 'Could not start the local API.');
    } else {
      this._feedback.markSaved(this._toggle, true);
    }
    if (r && r.config) this.apply(r.config);
  }

  async _savePort() {
    const r = await this._api.setPort(parseInt(this._port.value, 10));
    if (r && r.success === false) this._feedback.markSaved(this._port, false, r.error || 'Invalid port.');
    else this._feedback.markSaved(this._port, true);
    if (r && r.config) this.apply(r.config);
  }
}
