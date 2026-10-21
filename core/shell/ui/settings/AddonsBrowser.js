import HtmlEscaper from '../../../llm-server/ui/js/format/HtmlEscaper.js';
import ManifestCopy from './ManifestCopy.js';
import ExtCard from './ExtCard.js';

export default class AddonsBrowser {
  static CATALOG_CHANNEL = 'core.shell.getAvailableAddons';

  static INSTALL_CHANNEL = 'core.shell.downloadAndInstallAddon';

  static INTRO = 'Optional add-ons from lumabyte.com. They install in place and run without a restart.';

  constructor({ pane, hooks }) {
    this._pane = pane;
    this._hooks = hooks;
  }

  async load() {
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
      <div class="ext-addons-view ext-pane-section">
        <p class="ext-pane-intro ext-pane-head">${HtmlEscaper.escape(AddonsBrowser.INTRO)}</p>
        <div id="ext-addons-list" class="luma-muted ext-addons-loading"><span class="luma-spinner"></span> Loading add-ons...</div>
      </div>
    `;
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
    listEl.className = '';
    listEl.innerHTML = ExtCard.listHtml(res.extensions.map((addon) => ExtCard.html(AddonsBrowser.spec(addon))));
    const view = listEl.querySelector('.ext-item-list');
    ExtCard.wireFolding(view);
    view.querySelectorAll('.ext-item').forEach((card) => {
      const btn = card.querySelector('.ext-addon-get-btn');
      if (btn) btn.addEventListener('click', () => this._install(card.dataset.cardId, btn));
    });
  }

  static stateOf(addon) {
    if (!addon.installed) return 'install';
    if (addon.installedVersion && addon.version && AddonsBrowser.compareVersions(addon.version, addon.installedVersion) > 0) return 'update';
    return 'installed';
  }

  static spec(addon) {
    const state = AddonsBrowser.stateOf(addon);
    const size = addon.bytes ? `${(addon.bytes / 1024).toFixed(0)} KB` : '';
    const description = ManifestCopy.clean(addon.description || '');
    const details = [];
    if (addon.installedVersion) details.push({ label: 'Installed', value: `v${addon.installedVersion}` });
    if (addon.version) details.push({ label: 'Available', value: `v${addon.version}` });
    if (size) details.push({ label: 'Download', value: size });
    return {
      id: addon.id,
      name: addon.name || addon.id,
      version: addon.installedVersion || addon.version || '1.0.0',
      summary: description,
      description,
      details,
      status: state === 'installed' ? { text: 'Installed' } : null,
      primary: state === 'install' ? { label: 'Install', cls: 'ext-addon-get-btn' }
        : state === 'update' ? { label: `Update to v${addon.version}`, cls: 'ext-addon-get-btn' } : null,
      actions: state === 'installed' ? [{ label: 'Reinstall', cls: 'ext-addon-get-btn' }] : [],
    };
  }

  static compareVersions(a, b) {
    const pa = String(a).split('.');
    const pb = String(b).split('.');
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const x = pa[i] || '0';
      const y = pb[i] || '0';
      const nx = Number(x);
      const ny = Number(y);
      const diff = Number.isFinite(nx) && Number.isFinite(ny) ? nx - ny : x.localeCompare(y);
      if (diff) return diff > 0 ? 1 : -1;
    }
    return 0;
  }

  async _install(addonId, btn) {
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Installing...';
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
