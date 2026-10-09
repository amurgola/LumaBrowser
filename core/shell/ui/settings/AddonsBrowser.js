import HtmlEscaper from '../../../llm-server/ui/js/format/HtmlEscaper.js';
import ManifestCopy from './ManifestCopy.js';

export default class AddonsBrowser {
  static CATALOG_CHANNEL = 'core.shell.getAvailableAddons';

  static INSTALL_CHANNEL = 'core.shell.downloadAndInstallAddon';

  constructor({ pane, hooks, onBack }) {
    this._pane = pane;
    this._hooks = hooks;
    this._onBack = onBack;
  }

  async show() {
    if (!this._pane || !window.ipcBridge) return;
    const listEl = this._renderShell();
    let res;
    try {
      res = await window.ipcBridge.invoke(AddonsBrowser.CATALOG_CHANNEL);
    } catch (e) {
      listEl.innerHTML = `<div class="luma-callout bad">Failed to load add-ons: ${HtmlEscaper.escape(e.message)}</div>`;
      return;
    }
    this._renderCatalog(listEl, res);
  }

  _renderShell() {
    this._pane.innerHTML = `
      <div class="ext-addons-view">
        <div class="ext-addons-header" style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
          <button class="ext-config-back-btn" id="ext-addons-back">${ManifestCopy.BACK_ICON} Back</button>
          <h3 style="margin:0;">Optional Add-ons</h3>
        </div>
        <div id="ext-addons-list" class="luma-muted" style="padding:12px 0;"><span class="luma-spinner"></span> Loading add-ons...</div>
      </div>
    `;
    this._pane.querySelector('#ext-addons-back').addEventListener('click', () => this._onBack());
    return this._pane.querySelector('#ext-addons-list');
  }

  _renderCatalog(listEl, res) {
    if (!res || !res.ok) {
      listEl.innerHTML = `<div class="luma-callout bad">${HtmlEscaper.escape((res && res.error) || 'Could not load the add-on catalog.')}</div>`;
      return;
    }
    if (!res.extensions || res.extensions.length === 0) {
      listEl.innerHTML = '<div class="luma-empty">No optional add-ons are available right now.</div>';
      return;
    }
    listEl.innerHTML = '';
    const view = document.createElement('div');
    view.className = 'ext-list-view';
    for (const addon of res.extensions) view.appendChild(this._row(addon));
    listEl.appendChild(view);
  }

  _row(addon) {
    const esc = HtmlEscaper.escape;
    const sizeKb = addon.bytes ? `${(addon.bytes / 1024).toFixed(0)} KB` : '';
    const item = document.createElement('div');
    item.className = 'ext-list-item';
    item.innerHTML = `
        <div class="ext-list-item-info">
          <div class="ext-list-item-name">${esc(addon.name || addon.id)} <span class="ext-list-item-version">v${esc(addon.version || '1.0.0')}</span>${sizeKb ? ` <span class="ext-list-item-version">${esc(sizeKb)}</span>` : ''}</div>
          <div class="ext-list-item-desc">${esc(addon.description || '')}</div>
        </div>
        <div class="ext-list-item-actions">
          <button class="btn ${addon.installed ? 'btn-secondary' : 'btn-primary'} ext-addon-get-btn">${addon.installed ? 'Reinstall' : 'Download'}</button>
        </div>
      `;
    const btn = item.querySelector('.ext-addon-get-btn');
    btn.addEventListener('click', () => this._install(addon.id, btn));
    return item;
  }

  async _install(addonId, btn) {
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Downloading…';
    try {
      const result = await window.ipcBridge.invoke(AddonsBrowser.INSTALL_CHANNEL, addonId);
      if (result && result.success) this._installed(btn, result, addonId);
      else this._failed(btn, originalText, (result && result.error) || 'unknown error');
    } catch (e) {
      this._failed(btn, originalText, e.message);
    }
  }

  _installed(btn, result, addonId) {
    const name = result.name || addonId;
    btn.textContent = result.activated ? 'Installed' : 'Installed (restart to run)';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-secondary');
    this._hooks.toast(result.activated
      ? `"${name}" installed and running.`
      : `"${name}" installed, but it could not be started right now. Restart the app to activate it.`, result.activated ? 'ok' : 'bad');
  }

  _failed(btn, originalText, message) {
    btn.disabled = false;
    btn.textContent = originalText;
    this._hooks.toast(`Could not install the add-on: ${message}`, 'bad');
  }
}
