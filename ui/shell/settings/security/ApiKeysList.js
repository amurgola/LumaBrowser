import HtmlEscaper from '../../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import Dialogs from '../../../../core/llm-server/ui/js/dialogs/Dialogs.js';
import CopyButton from '../CopyButton.js';

export default class ApiKeysList {
  constructor({ api, feedback, state }) {
    this._api = api;
    this._feedback = feedback;
    this._state = state;
    this._list = document.getElementById('gsApiSecKeysList');
    this._labelInput = document.getElementById('gsApiSecKeyLabel');
    this._createBtn = document.getElementById('gsApiSecKeyCreate');
    this._reveal = document.getElementById('gsApiSecNewKeyReveal');
    this._revealValue = document.getElementById('gsApiSecNewKeyValue');
    this._revealCopy = document.getElementById('gsApiSecNewKeyCopy');
    this._revealDismiss = document.getElementById('gsApiSecNewKeyDismiss');
  }

  static masked(k) {
    return { ...k, key: (k.key && k.key.length > 12) ? `${k.key.slice(0, 6)}...${k.key.slice(-4)}` : '******' };
  }

  install() {
    this._createBtn.addEventListener('click', () => this._create());
    this._revealCopy.addEventListener('click', () => {
      const v = this._revealValue.textContent || '';
      if (v) CopyButton.copy(this._revealCopy, v);
    });
    this._revealDismiss.addEventListener('click', () => this.hideReveal());
    this._list.addEventListener('click', (e) => this._onClick(e));
    this._list.addEventListener('change', (e) => this._onRename(e));
  }

  hideReveal() {
    this._reveal.style.display = 'none';
    this._revealValue.textContent = '';
  }

  render() {
    const keys = this._state.apiKeys;
    if (!keys.length) {
      this._list.innerHTML = '<div class="luma-empty luma-empty--plain" style="text-align:left;padding:4px 0;">No keys yet. Create one below.</div>';
      return;
    }
    this._list.innerHTML = keys.map((k) => ApiKeysList.rowHtml(k)).join('');
  }

  static rowHtml(k) {
    const esc = HtmlEscaper.escape;
    return `
      <div class="api-sec-key-row gs-item-card" data-api-sec-key-id="${esc(k.id)}" style="padding:10px;display:flex;flex-direction:column;gap:6px;">
        <div style="display:flex;gap:8px;align-items:center;">
          <input type="text" class="form-input" data-api-sec-key-label value="${esc(k.label)}" style="flex:1;padding:6px 10px !important;font-size:12px !important;">
          <span style="font-size:10px;color:var(--text-muted);">${esc(new Date(k.createdAt).toLocaleDateString())}</span>
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
          <code data-api-sec-key-value data-masked="${esc(k.key)}" style="flex:1;font-family:var(--font-mono);font-size:11.5px;color:var(--text-secondary);word-break:break-all;">${esc(k.key)}</code>
          <button class="gs-copy-btn" data-api-sec-key-reveal>Reveal</button>
          <button class="gs-copy-btn" data-api-sec-key-copy>Copy</button>
          <button class="gs-copy-btn" data-api-sec-key-refresh>Refresh</button>
          <button class="gs-copy-btn" data-api-sec-key-delete>Delete</button>
        </div>
        <div class="gs-inline-error" data-api-sec-key-error hidden></div>
      </div>`;
  }

  maskAll() {
    this._list.querySelectorAll('[data-api-sec-key-value]').forEach((codeEl) => {
      codeEl.textContent = codeEl.getAttribute('data-masked') || '';
      const btn = codeEl.parentElement && codeEl.parentElement.querySelector('[data-api-sec-key-reveal]');
      if (btn) btn.textContent = 'Reveal';
    });
    this.hideReveal();
  }

  _showReveal(plaintext) {
    this._revealValue.textContent = plaintext;
    this._reveal.style.display = '';
  }

  async _create() {
    const label = (this._labelInput.value || '').trim() || 'Untitled key';
    const result = await this._api.createKey(label);
    if (result && result.success && result.key) {
      this._state.apiKeys = [...this._state.apiKeys, ApiKeysList.masked(result.key)];
      this._labelInput.value = '';
      this.render();
      this._showReveal(result.key.key);
    } else {
      this._feedback.toast((result && result.error) || 'Could not create the API key', 'bad');
    }
  }

  static async _fetchValue(id) {
    const r = await window.ipcBridge.invoke('core.settings.apiSecurity.revealKey', id);
    if (!r || !r.success) throw new Error((r && r.error) || 'Could not read the key');
    return r.key;
  }

  async _onClick(e) {
    const row = e.target.closest && e.target.closest('[data-api-sec-key-id]');
    if (!row) return;
    const id = row.getAttribute('data-api-sec-key-id');
    const entry = this._state.apiKeys.find((k) => k.id === id);
    if (!entry) return;
    const showError = (msg) => ApiKeysList._rowError(row, msg);
    if (e.target.hasAttribute('data-api-sec-key-reveal')) await this._toggleReveal(row, id, e.target, showError);
    else if (e.target.hasAttribute('data-api-sec-key-copy')) await this._copyKey(id, e.target, showError);
    else if (e.target.hasAttribute('data-api-sec-key-refresh')) await this._refreshKey(id, showError);
    else if (e.target.hasAttribute('data-api-sec-key-delete')) await this._deleteKey(entry, id, showError);
  }

  async _toggleReveal(row, id, btn, showError) {
    const codeEl = row.querySelector('[data-api-sec-key-value]');
    if (codeEl.textContent !== codeEl.getAttribute('data-masked')) {
      codeEl.textContent = codeEl.getAttribute('data-masked');
      btn.textContent = 'Reveal';
      return;
    }
    try {
      codeEl.textContent = await ApiKeysList._fetchValue(id);
      btn.textContent = 'Hide';
      showError('');
    } catch (err) { showError(err.message); }
  }

  async _copyKey(id, btn, showError) {
    try {
      const value = await ApiKeysList._fetchValue(id);
      await navigator.clipboard.writeText(value);
      const orig = btn.textContent;
      btn.textContent = 'Copied';
      setTimeout(() => { btn.textContent = orig; }, CopyButton.FLASH_MS);
      showError('');
    } catch (err) { showError(err.message); }
  }

  async _refreshKey(id, showError) {
    if (!(await Dialogs.confirm('Generate a new value for this key? The old value stops working immediately.', { okLabel: 'Generate' }))) return;
    const result = await this._api.refreshKey(id);
    if (result && result.success && result.key) {
      this._state.apiKeys = this._state.apiKeys.map((k) => (k.id === id ? ApiKeysList.masked(result.key) : k));
      this.render();
      this._showReveal(result.key.key);
    } else {
      showError((result && result.error) || 'Could not refresh the key');
    }
  }

  async _deleteKey(entry, id, showError) {
    const msg = `Delete key "${entry.label}"? Clients using it lose access immediately. This cannot be undone.`;
    if (!(await Dialogs.confirm(msg, { okLabel: 'Delete', danger: true }))) return;
    const result = await this._api.deleteKey(id);
    if (result && result.success) {
      this._state.apiKeys = this._state.apiKeys.filter((k) => k.id !== id);
      this.render();
    } else {
      showError((result && result.error) || 'Could not delete the key');
    }
  }

  async _onRename(e) {
    if (!e.target.hasAttribute('data-api-sec-key-label')) return;
    const row = e.target.closest('[data-api-sec-key-id]');
    if (!row) return;
    const id = row.getAttribute('data-api-sec-key-id');
    const result = await this._api.updateKeyLabel(id, e.target.value.trim() || 'Untitled key');
    if (result && result.success && result.key) {
      this._state.apiKeys = this._state.apiKeys.map((k) => (k.id === id ? { ...k, label: result.key.label } : k));
      this._feedback.markSaved(e.target, true);
    } else {
      this._feedback.markSaved(e.target, false, (result && result.error) || 'Could not rename the key');
    }
  }

  static _rowError(row, msg) {
    const el = row.querySelector('[data-api-sec-key-error]');
    if (!el) return;
    el.textContent = msg || '';
    el.hidden = !msg;
  }
}
