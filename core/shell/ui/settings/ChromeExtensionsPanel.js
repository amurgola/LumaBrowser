import Dialogs from '../../../llm-server/ui/js/dialogs/Dialogs.js';
import HtmlEscaper from '../../../llm-server/ui/js/format/HtmlEscaper.js';

export default class ChromeExtensionsPanel {
  static LIMITATIONS = `
          <details class="gs-disclosure">
            <summary>Limitations: read this before installing</summary>
            <div class="gs-disclosure-body">
              <p>LumaBrowser runs on Electron, which implements only a small subset of the Chrome extension APIs. Many popular extensions will load but not function fully.</p>

              <h5 class="gs-group-subtitle">Supported <code>chrome.*</code> APIs</h5>
              <p class="gs-api-list">storage, tabs (subset), runtime (subset), i18n, webNavigation, management</p>

              <h5 class="gs-group-subtitle">Not implemented</h5>
              <p class="gs-api-list">webRequest, declarativeNetRequest, contextMenus, cookies, action/browserAction, alarms, notifications, privacy, permissions</p>

              <h5 class="gs-group-subtitle">What this means in practice</h5>
              <ul>
                <li><b>Ad blockers (uBlock Origin, AdBlock, etc.)</b>: <span class="gs-status-bad">block nothing.</span> They depend entirely on <code>chrome.webRequest</code>. Use the built-in <b>Block ads and trackers</b> switch under <i>General</i> instead; it runs EasyList/EasyPrivacy natively against Electron's session layer.</li>
                <li><b>Password managers (Bitwarden, 1Password)</b>: autofill via content scripts usually works. The toolbar popup and lock/unlock UI do not render.</li>
                <li><b>Content-script extensions (Dark Reader, Stylus, site helpers)</b>: generally work.</li>
                <li><b>MV3 extensions</b>: service worker lifecycle and <code>declarativeNetRequest</code> are missing. Prefer MV2 builds where available.</li>
                <li><b>No toolbar UI</b>: browser actions, popups, badge icons, and the extensions management page are not rendered. Interact via content scripts and hotkeys only.</li>
                <li><b>No <code>chrome-extension://</code> options pages</b>: extension settings pages cannot be opened in a tab.</li>
              </ul>

              <h5 class="gs-group-subtitle">Warnings on load</h5>
              <p>It is normal to see <code>ExtensionLoadWarning</code> messages in the console for unsupported permissions (<code>contextMenus</code>, <code>privacy</code>, <code>webRequest</code>, and so on). The extension still loads; those permissions are silently ignored.</p>
            </div>
          </details>`;

  constructor(container) {
    this._container = container;
  }

  async load() {
    if (!this._container || !window.ipcBridge) return;
    await this._render();
  }

  async _render() {
    let extensions = [];
    try {
      extensions = await this._invoke('core.chromeExtensions.list');
    } catch (err) {
      this._container.innerHTML = `<div class="luma-callout bad">Failed to load extensions: ${HtmlEscaper.escape(err.message)}</div>`;
      return;
    }
    this._container.innerHTML = ChromeExtensionsPanel._html(extensions);
    this._container.querySelector('#chromeExtInstallBtn').addEventListener('click', () => this._install());
    this._container.querySelectorAll('[data-ext-id]').forEach((row) => this._wireRow(row));
  }

  static _html(extensions) {
    const rows = extensions.map((ext) => ChromeExtensionsPanel._rowHtml(ext)).join('');
    return `
        <div class="gs-panel-narrow">
          <div class="luma-form-actions ext-form-buttons--start ext-mb-12">
            <button class="luma-btn primary" id="chromeExtInstallBtn">Install unpacked extension...</button>
          </div>
          <div id="chromeExtErrorMsg" class="luma-callout bad gs-row-notice" style="display:none;"></div>

          <div id="chromeExtList" class="gs-ext-list">
            ${extensions.length ? rows : '<div class="luma-empty luma-empty--plain">No Chrome extensions installed yet. Install an unpacked extension folder to try one.</div>'}
          </div>
${ChromeExtensionsPanel.LIMITATIONS}
        </div>
      `;
  }

  static _rowHtml(ext) {
    const esc = HtmlEscaper.escape;
    return `
        <div class="ext-list-item" data-ext-id="${esc(ext.id)}">
          <div class="ext-list-item-info">
            <div class="ext-list-item-name">${esc(ext.name)} <span class="ext-list-item-version">v${esc(ext.version || '?')}</span></div>
            <div class="ext-list-item-desc ext-list-item-meta">
              <span class="luma-tag">MV${ext.manifestVersion || 2}</span>
              <span class="luma-code-inline">${esc(ext.id)}</span>
            </div>
          </div>
          <div class="ext-list-item-actions">
            <span class="ext-list-no-config chrome-ext-state">${ext.enabled ? 'Enabled' : 'Disabled'}</span>
            <button class="luma-btn danger chrome-ext-remove">Remove</button>
            <label class="luma-switch" title="${ext.enabled ? 'Disable' : 'Enable'} this extension">
              <input type="checkbox" class="chrome-ext-toggle" ${ext.enabled ? 'checked' : ''}>
              <span class="luma-switch-track"></span>
            </label>
          </div>
        </div>
      `;
  }

  async _install() {
    this._errorEl().style.display = 'none';
    const pick = await this._invoke('core.chromeExtensions.pickFolder');
    if (pick.canceled) return;
    const result = await this._invoke('core.chromeExtensions.installUnpacked', pick.path);
    if (!result.success) { this._showError(result.error || 'Install failed'); return; }
    await this._render();
  }

  _wireRow(row) {
    const id = row.dataset.extId;
    row.querySelector('.chrome-ext-toggle').addEventListener('change', async (e) => {
      const result = await this._invoke('core.chromeExtensions.toggle', id, e.target.checked);
      if (!result.success) this._showError(result.error || 'Toggle failed');
      await this._render();
    });
    row.querySelector('.chrome-ext-remove').addEventListener('click', () => this._remove(row, id));
  }

  async _remove(row, id) {
    const nameEl = row.querySelector('.ext-list-item-name');
    const name = nameEl ? nameEl.firstChild.textContent.trim() : 'this extension';
    if (!(await Dialogs.confirm(`Remove "${name}"? Its files will be deleted.`, { okLabel: 'Remove', danger: true }))) return;
    const result = await this._invoke('core.chromeExtensions.remove', id);
    if (!result.success) this._showError(result.error || 'Remove failed');
    await this._render();
  }

  _errorEl() {
    return this._container.querySelector('#chromeExtErrorMsg');
  }

  _showError(msg) {
    const el = this._errorEl();
    el.textContent = msg;
    el.style.display = 'block';
  }

  _invoke(channel, ...args) {
    return window.ipcBridge.invoke(channel, ...args);
  }
}
