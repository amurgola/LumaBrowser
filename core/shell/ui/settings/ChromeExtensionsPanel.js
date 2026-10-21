import Dialogs from '../../../llm-server/ui/js/dialogs/Dialogs.js';
import HtmlEscaper from '../../../llm-server/ui/js/format/HtmlEscaper.js';
import ChromeStorePanel from './ChromeStorePanel.js';
import ExtCard from './ExtCard.js';

export default class ChromeExtensionsPanel {
  static MODIFIED_EVENT = 'chrome-extensions:modified';
  static WEB_URL = /^https?:\/\//i;
  static SOURCE_WEBSTORE = 'webstore';

  static LIMITATIONS = `
          <details class="gs-disclosure">
            <summary>Limitations: read this before installing</summary>
            <div class="gs-disclosure-body">
              <p>LumaBrowser runs on Electron, which implements only a small subset of the Chrome extension APIs. Many popular extensions will load but not function fully.</p>

              <h5 class="gs-group-subtitle">Supported <code>chrome.*</code> APIs (Electron 43)</h5>
              <p class="gs-api-list">action, alarms, clipboard, extension, i18n, idle, management, offscreen, runtime, scripting, storage, tabs (subset), webRequest (subset)</p>

              <h5 class="gs-group-subtitle">Provided by LumaBrowser</h5>
              <p class="gs-api-list">webNavigation (events and frame queries), contextMenus (items appear in the page's right-click menu), storage.sync (kept locally)</p>
              <p>webNavigation and contextMenus work from an extension's background service worker, which is where extensions use them.</p>

              <h5 class="gs-group-subtitle">Shimmed with inert stubs</h5>
              <p class="gs-api-list">windows, declarativeNetRequest, cookies, notifications, privacy, permissions, commands, sidePanel, userScripts, native messaging</p>
              <p>LumaBrowser adds these to every installed extension so it starts instead of crashing on the first missing API. Events on them never fire and calls answer with empty results, so a feature built on one of them silently does nothing.</p>

              <h5 class="gs-group-subtitle">What this means in practice</h5>
              <ul>
                <li><b>Ad blockers (uBlock Origin, AdBlock, etc.)</b>: <span class="gs-status-bad">block nothing.</span> They depend entirely on <code>chrome.webRequest</code>. Use the built-in <b>Block ads and trackers</b> switch under <i>General</i> instead; it runs EasyList/EasyPrivacy natively against Electron's session layer.</li>
                <li><b>Password managers (Bitwarden, Proton Pass)</b>: unlock and manage the vault from the extension's toolbar button next to the address bar (or <b>Open</b> on its card here); autofill runs from the in-page menu and from the page's right-click menu. Pop-out windows and desktop-app biometrics do nothing. Managers that need a desktop app (1Password, KeePassXC) cannot reach it: native messaging is not available.</li>
                <li><b>Content-script extensions (Dark Reader, Stylus, site helpers)</b>: generally work.</li>
                <li><b>MV3 extensions</b>: service worker lifecycle and <code>declarativeNetRequest</code> are missing. Prefer MV2 builds where available.</li>
                <li><b>Toolbar buttons</b>: every enabled extension with a popup gets a button next to the address bar that opens it, as in Chrome. Badge text and icons the extension changes at run time are not shown. <b>Options</b> opens its settings page in its own window.</li>
                <li><b>Script managers (Tampermonkey, Violentmonkey)</b>: need the <code>userScripts</code> API and do not run scripts.</li>
              </ul>

              <h5 class="gs-group-subtitle">Warnings on load</h5>
              <p>Electron reports permissions it does not implement (<code>contextMenus</code>, <code>privacy</code>, <code>notifications</code>, and so on) when an extension loads. LumaBrowser logs that once per extension; the extension still loads, and the permissions above are provided or shimmed.</p>
            </div>
          </details>`;

  constructor(container) {
    this._container = container;
    this._store = null;
    this._loaded = false;
    this._extensions = [];
    this._updates = new Map();
    this._checking = new Set();
    this._openIds = new Set();
    document.addEventListener(ChromeExtensionsPanel.MODIFIED_EVENT, () => { if (this._loaded) this._render(); });
  }

  async load() {
    if (!this._container || !window.ipcBridge) return;
    this._container.innerHTML = ChromeExtensionsPanel._layoutHtml();
    this._loaded = true;
    this._store = new ChromeStorePanel(this._container.querySelector('#chromeStoreSection'), {
      invoke: (channel, ...args) => this._invoke(channel, ...args),
      onInstalled: async (ext) => { await this._renderInstalled(); this._announceRunning(ext); },
      onRemove: (id, name) => this._remove(id, name),
    });
    this._container.querySelector('#chromeExtInstallBtn').addEventListener('click', () => this._install());
    this._container.querySelector('#chromeExtReloadTabsBtn').addEventListener('click', () => this._reloadOpenTabs());
    const list = this._container.querySelector('#chromeExtList');
    ExtCard.wireFolding(list, { onToggle: (id, open) => (open ? this._openIds.add(id) : this._openIds.delete(id)) });
    list.addEventListener('click', (e) => this._onListClick(e));
    await Promise.all([this._store.load(), this._renderInstalled()]);
  }

  async _render() {
    await this._renderInstalled();
    if (this._store) await this._store.load();
  }

  async _renderInstalled() {
    const list = this._container.querySelector('#chromeExtList');
    try {
      this._extensions = await this._invoke('core.chromeExtensions.list');
    } catch (err) {
      list.innerHTML = `<div class="luma-callout bad">Failed to load extensions: ${HtmlEscaper.escape(err.message)}</div>`;
      return;
    }
    document.dispatchEvent(new CustomEvent('chrome-extensions:changed', { detail: this._extensions }));
    this._drawInstalled();
    this._checkUpdates();
  }

  _drawInstalled() {
    const list = this._container.querySelector('#chromeExtList');
    const count = this._container.querySelector('#chromeExtCount');
    if (count) count.textContent = this._extensions.length ? String(this._extensions.length) : '';
    list.innerHTML = this._extensions.length
      ? ExtCard.listHtml(this._extensions.map((ext) => ExtCard.html(this.cardSpec(ext))))
      : '<div class="luma-empty">No Chrome extensions installed yet. Pick one from the store below, or install an unpacked folder.</div>';
    list.querySelectorAll('.chrome-ext-toggle').forEach((box) => box.addEventListener('change', (e) => this._onListChange(e)));
  }

  cardSpec(ext) {
    const fromStore = ext.source === ChromeExtensionsPanel.SOURCE_WEBSTORE;
    const update = this._updates.get(ext.id);
    const updateAvailable = !!(update && update.updateAvailable);
    const pages = (ext.enabled && ext.pages) || {};
    const actions = [];
    if (pages.options) actions.push({ label: 'Options', cls: 'chrome-ext-open' });
    if (fromStore && !updateAvailable) actions.push({ label: 'Reinstall', cls: 'chrome-ext-update', title: 'Download this version again from the Chrome Web Store' });
    actions.push({ label: 'Remove', cls: 'chrome-ext-remove', danger: true });
    let primary = null;
    if (updateAvailable) primary = { label: `Update to v${update.latestVersion}`, cls: 'chrome-ext-update' };
    else if (pages.popup) primary = { label: 'Open', cls: 'chrome-ext-open chrome-ext-open-popup' };
    return {
      id: ext.id,
      name: ext.name,
      version: ext.version || '?',
      icon: ext.icon || null,
      summary: ext.description || (fromStore ? 'From the Chrome Web Store' : 'Unpacked folder'),
      description: ext.description || '',
      dim: !ext.enabled,
      open: this._openIds.has(ext.id),
      check: { checked: !!ext.enabled, cls: 'chrome-ext-toggle' },
      primary,
      details: [
        { label: 'Source', value: fromStore ? 'Chrome Web Store' : 'Unpacked folder' },
        ...(update && update.latestVersion ? [{ label: 'Latest', value: `v${update.latestVersion}` }] : []),
        { label: 'ID', value: ext.id, mono: true },
      ],
      actions,
      attrs: `data-ext-id="${HtmlEscaper.escape(ext.id)}"`,
    };
  }

  _checkUpdates() {
    for (const ext of this._extensions) {
      if (ext.source !== ChromeExtensionsPanel.SOURCE_WEBSTORE || this._updates.has(ext.id) || this._checking.has(ext.id)) continue;
      this._checking.add(ext.id);
      this._invoke('core.chromeExtensions.checkUpdate', ext.id).then((result) => {
        this._checking.delete(ext.id);
        if (!result || !result.success || !result.update) return;
        this._updates.set(ext.id, result.update);
        if (this._extensions.some((e) => e.id === ext.id)) this._drawInstalled();
      }).catch(() => this._checking.delete(ext.id));
    }
  }

  static _layoutHtml() {
    return `
        <section class="ext-pane-section">
          <div class="ext-pane-head">
            <h4 class="gs-subsection-title">Installed <span class="gs-subsection-count" id="chromeExtCount"></span></h4>
            <button class="luma-btn luma-btn--sm" id="chromeExtInstallBtn">Install unpacked folder</button>
          </div>
          <div id="chromeExtErrorMsg" class="luma-callout bad gs-row-notice" style="display:none;"></div>
          <div id="chromeExtInfoMsg" class="luma-callout ok gs-row-notice" style="display:none;"></div>
          <div id="chromeExtReloadNotice" class="luma-callout ok gs-row-notice chrome-ext-reload-notice" style="display:none;">
            <span class="chrome-ext-reload-text"></span>
            <button class="luma-btn luma-btn--sm" id="chromeExtReloadTabsBtn">Reload open tabs</button>
          </div>
          <div id="chromeExtList" class="gs-ext-list"></div>
        </section>

        <section class="ext-pane-section chrome-store" id="chromeStoreSection"></section>

        <section class="ext-pane-section">${ChromeExtensionsPanel.LIMITATIONS}
        </section>
      `;
  }

  async _install() {
    this._showError(null);
    const pick = await this._invoke('core.chromeExtensions.pickFolder');
    if (pick.canceled) return;
    const result = await this._invoke('core.chromeExtensions.installUnpacked', pick.path);
    if (!result.success) { this._showError(result.error || 'Install failed'); return; }
    await this._render();
    this._announceRunning(result.extension);
  }

  _announceRunning(ext) {
    const el = this._container.querySelector('#chromeExtReloadNotice');
    if (!el || !ext) return;
    el.querySelector('.chrome-ext-reload-text').textContent =
      `${ext.name} is installed and running. Tabs that were already open pick it up when they reload.`;
    el.style.display = 'flex';
  }

  async _reloadOpenTabs() {
    let tabs = [];
    try { tabs = await window.tabAPI.getOrder(); } catch (_) { tabs = []; }
    const targets = ChromeExtensionsPanel.reloadTargets(tabs);
    await Promise.all(targets.map((tab) => window.tabAPI.reload(tab.id).catch(() => {})));
    ChromeExtensionsPanel._showNotice(this._container.querySelector('#chromeExtReloadNotice'), null);
    this._showInfo(`Reloaded ${targets.length} tab${targets.length === 1 ? '' : 's'}.`);
  }

  static reloadTargets(tabs) {
    return (Array.isArray(tabs) ? tabs : []).filter((tab) => tab && tab.kind === 'user' && !tab.silent && ChromeExtensionsPanel.WEB_URL.test(tab.url || ''));
  }

  _extOf(target) {
    const card = target.closest && target.closest('[data-ext-id]');
    return card ? this._extensions.find((e) => e.id === card.dataset.extId) : null;
  }

  _onListClick(e) {
    const button = e.target.closest && e.target.closest('button');
    if (!button || button.disabled) return;
    const ext = this._extOf(button);
    if (!ext) return;
    if (button.classList.contains('chrome-ext-open')) this._openPage(ext, button.classList.contains('chrome-ext-open-popup') ? 'popup' : 'options');
    else if (button.classList.contains('chrome-ext-update')) this._update(button, ext);
    else if (button.classList.contains('chrome-ext-remove')) this._remove(ext.id, ext.name);
  }

  async _onListChange(e) {
    if (!e.target.classList.contains('chrome-ext-toggle')) return;
    const ext = this._extOf(e.target);
    if (!ext) return;
    const enabling = e.target.checked;
    const result = await this._invoke('core.chromeExtensions.toggle', ext.id, enabling);
    if (!result.success) this._showError(result.error || 'Toggle failed');
    await this._render();
    if (result.success && enabling) this._announceRunning(ext);
  }

  async _openPage(ext, kind) {
    const result = await this._invoke('core.chromeExtensions.openPage', ext.id, kind);
    if (!result.success) this._showError(result.error || 'Could not open the extension page');
  }

  async _remove(id, name) {
    if (!(await Dialogs.confirm(`Remove "${name}"? Its files will be deleted.`, { okLabel: 'Remove', danger: true }))) return;
    const result = await this._invoke('core.chromeExtensions.remove', id);
    if (!result.success) this._showError(result.error || 'Remove failed');
    this._updates.delete(id);
    await this._render();
  }

  async _update(button, ext) {
    this._showError(null);
    this._showInfo(null);
    const label = button.textContent;
    button.disabled = true;
    button.textContent = label.startsWith('Update') ? 'Updating...' : 'Reinstalling...';
    const result = await this._invoke('core.chromeExtensions.installFromStore', ext.id);
    if (!result.success) {
      button.disabled = false;
      button.textContent = label;
      this._showError(result.error || 'Update failed');
      return;
    }
    this._updates.set(ext.id, { latestVersion: result.extension.version, updateAvailable: false });
    this._showInfo(`${ext.name} is at v${result.extension.version}.`);
    await this._render();
  }

  _showError(msg) {
    ChromeExtensionsPanel._showNotice(this._container.querySelector('#chromeExtErrorMsg'), msg);
  }

  _showInfo(msg) {
    ChromeExtensionsPanel._showNotice(this._container.querySelector('#chromeExtInfoMsg'), msg);
  }

  static _showNotice(el, msg) {
    if (!el) return;
    el.textContent = msg || '';
    el.style.display = msg ? 'block' : 'none';
  }

  _invoke(channel, ...args) {
    return window.ipcBridge.invoke(channel, ...args);
  }
}
