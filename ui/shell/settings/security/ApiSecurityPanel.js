import HtmlEscaper from '../../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import ApiKeysList from './ApiKeysList.js';

export default class ApiSecurityPanel {
  constructor({ feedback }) {
    this._feedback = feedback;
    this.state = { networkMode: 'system', ipWhitelist: [], requireApiKey: false, apiKeys: [] };
  }

  install() {
    this._api = window.electronAPI && window.electronAPI.apiSecurity;
    this._el = ApiSecurityPanel._elements();
    if (!this._api || !this._el.modeGroup || !document.getElementById('settingsBtn')) return;
    this._keys = new ApiKeysList({ api: this._api, feedback: this._feedback, state: this.state });
    this._whitelistError = this._insertWhitelistError();
    this._keys.install();
    this._wire();
  }

  async load() {
    try {
      const cfg = await this._api.get();
      if (cfg) Object.assign(this.state, ApiSecurityPanel.normalise(cfg));
      this._applyAll();
    } catch (e) {
      console.error('Failed to load API security config:', e);
    }
  }

  static normalise(cfg) {
    return {
      networkMode: cfg.networkMode || 'system',
      ipWhitelist: Array.isArray(cfg.ipWhitelist) ? cfg.ipWhitelist : [],
      requireApiKey: !!cfg.requireApiKey,
      apiKeys: Array.isArray(cfg.apiKeys) ? cfg.apiKeys : [],
    };
  }

  static _elements() {
    const $ = (id) => document.getElementById(id);
    return {
      modeGroup: $('gsApiSecModeGroup'),
      whitelistWrap: $('gsApiSecWhitelistWrap'),
      whitelistList: $('gsApiSecWhitelist'),
      whitelistInput: $('gsApiSecWhitelistInput'),
      whitelistAdd: $('gsApiSecWhitelistAdd'),
      requireKey: $('gsApiSecRequireKey'),
      keysWrap: $('gsApiSecKeysWrap'),
      anyWarning: $('gsApiSecAnyWarning'),
    };
  }

  _wire() {
    const el = this._el;
    document.addEventListener('settings:open', () => {
      this._keys.hideReveal();
      this._showWhitelistError('');
      this.load();
    });
    document.addEventListener('settings:close', () => this._keys.maskAll());
    el.modeGroup.addEventListener('change', (e) => this._onModeChange(e));
    el.whitelistAdd.addEventListener('click', () => this._addWhitelistEntry());
    el.whitelistInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); el.whitelistAdd.click(); }
    });
    el.whitelistList.addEventListener('click', (e) => this._onWhitelistClick(e));
    el.requireKey.addEventListener('change', () => this._onRequireKeyChange());
  }

  _insertWhitelistError() {
    const el = document.createElement('div');
    el.className = 'gs-inline-error';
    el.style.marginTop = '6px';
    el.hidden = true;
    const input = this._el.whitelistInput;
    if (input && input.parentElement) input.parentElement.insertAdjacentElement('afterend', el);
    return el;
  }

  _showWhitelistError(msg) {
    this._whitelistError.textContent = msg || '';
    this._whitelistError.hidden = !msg;
  }

  _applyAll() {
    this._checkModeRadio();
    this._el.requireKey.checked = !!this.state.requireApiKey;
    this._applyRequireKeyVisibility();
    this._renderWhitelist();
    this._keys.render();
  }

  _checkModeRadio() {
    const radio = this._el.modeGroup.querySelector(`input[name="gsApiSecMode"][value="${this.state.networkMode}"]`);
    if (radio) radio.checked = true;
  }

  _applyModeVisibility() {
    this._el.whitelistWrap.style.display = this.state.networkMode === 'whitelist' ? '' : 'none';
    if (this._el.anyWarning) this._el.anyWarning.style.display = (this.state.networkMode === 'any' && !this.state.requireApiKey) ? '' : 'none';
  }

  _applyRequireKeyVisibility() {
    this._el.keysWrap.style.display = this.state.requireApiKey ? '' : 'none';
    this._applyModeVisibility();
  }

  _renderWhitelist() {
    const list = this._el.whitelistList;
    if (!this.state.ipWhitelist.length) {
      list.innerHTML = '<div class="luma-empty luma-empty--plain" style="text-align:left;padding:4px 0;">No IPs added yet.</div>';
      return;
    }
    list.innerHTML = this.state.ipWhitelist.map((ip, i) => `
      <div class="gs-item-card" style="display:flex;gap:8px;align-items:center;padding:6px 10px;">
        <code style="flex:1;font-family:var(--font-mono);font-size:12px;color:var(--text-primary);">${HtmlEscaper.escape(ip)}</code>
        <button class="gs-copy-btn" data-api-sec-wl-del="${i}">Delete</button>
      </div>`).join('');
  }

  async _onModeChange(e) {
    if (e.target.name !== 'gsApiSecMode') return;
    const mode = e.target.value;
    const result = await this._api.setNetworkMode(mode);
    if (result && result.success) {
      this.state.networkMode = mode;
      this._applyModeVisibility();
      this._feedback.markSaved(this._el.modeGroup, true);
    } else {
      this._feedback.markSaved(this._el.modeGroup, false, (result && result.error) || 'Could not set the network mode');
      this._checkModeRadio();
    }
  }

  async _addWhitelistEntry() {
    const entry = (this._el.whitelistInput.value || '').trim();
    if (!entry) return;
    const next = [...this.state.ipWhitelist, entry];
    if (await this._saveWhitelist(next, 'Could not add that address')) this._el.whitelistInput.value = '';
  }

  async _onWhitelistClick(e) {
    const idxStr = e.target.getAttribute && e.target.getAttribute('data-api-sec-wl-del');
    if (idxStr == null) return;
    const idx = parseInt(idxStr, 10);
    if (isNaN(idx)) return;
    await this._saveWhitelist(this.state.ipWhitelist.filter((_, i) => i !== idx), 'Could not remove that address');
  }

  async _saveWhitelist(next, failure) {
    const result = await this._api.setWhitelist(next);
    if (!(result && result.success)) {
      this._showWhitelistError((result && result.error) || failure);
      return false;
    }
    this.state.ipWhitelist = next;
    this._showWhitelistError('');
    this._renderWhitelist();
    return true;
  }

  async _onRequireKeyChange() {
    const toggle = this._el.requireKey;
    const enabled = !!toggle.checked;
    const result = await this._api.setRequireApiKey(enabled);
    if (result && result.success) {
      this.state.requireApiKey = enabled;
      this._applyRequireKeyVisibility();
      this._feedback.markSaved(toggle, true);
    } else {
      toggle.checked = !enabled;
      this._feedback.markSaved(toggle, false, (result && result.error) || 'Could not change the API key requirement');
    }
  }
}
