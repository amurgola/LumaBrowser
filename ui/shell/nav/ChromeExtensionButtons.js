import Dialogs from '../../../core/llm-server/ui/js/dialogs/Dialogs.js';

export default class ChromeExtensionButtons {
  static CHANGED_EVENT = 'chrome-extensions:changed';
  static MODIFIED_EVENT = 'chrome-extensions:modified';
  static POPUP_GAP = 4;
  static MENU_WIDTH = 220;

  constructor({ el = null, popupMenu = null, openSettings = null } = {}) {
    this._el = el;
    this._menu = popupMenu;
    this._openSettings = openSettings;
    this._signature = '';
  }

  install() {
    this._el = this._el || document.getElementById('chromeExtButtons');
    if (!this._el || !window.ipcBridge) return;
    document.addEventListener(ChromeExtensionButtons.CHANGED_EVENT, (e) => this._render(e.detail));
    window.addEventListener('focus', () => this.refresh());
    this.refresh();
  }

  async refresh() {
    try {
      this._render(await window.ipcBridge.invoke('core.chromeExtensions.list'));
    } catch (_) {}
  }

  static withPopup(extensions) {
    return (Array.isArray(extensions) ? extensions : []).filter((ext) => ext && ext.enabled && ext.pages && ext.pages.popup);
  }

  _render(extensions) {
    if (!this._el || !Array.isArray(extensions)) return;
    const shown = ChromeExtensionButtons.withPopup(extensions);
    const signature = JSON.stringify(shown.map((ext) => [ext.id, ext.name, ext.icon]));
    if (signature === this._signature) return;
    this._signature = signature;
    this._el.replaceChildren(...shown.map((ext) => this._button(ext)));
    this._el.hidden = shown.length === 0;
  }

  _button(ext) {
    const btn = document.createElement('button');
    btn.className = 'icon-btn chrome-ext-btn';
    btn.title = ext.name;
    btn.setAttribute('aria-label', ext.name);
    btn.dataset.extId = ext.id;
    if (ext.icon) {
      const img = document.createElement('img');
      img.className = 'chrome-ext-btn-icon';
      img.src = ext.icon;
      img.alt = '';
      btn.appendChild(img);
    } else {
      const letter = document.createElement('span');
      letter.className = 'chrome-ext-btn-letter';
      letter.textContent = String(ext.name || '?').trim().charAt(0).toUpperCase();
      btn.appendChild(letter);
    }
    btn.addEventListener('click', () => this._open(ext, btn));
    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showMenu(ext, btn);
    });
    return btn;
  }

  showMenu(ext, btn) {
    if (!this._menu) return;
    const { items, map } = this.menuFor(ext, btn);
    const r = btn.getBoundingClientRect();
    const x = Math.max(0, Math.round(r.right - ChromeExtensionButtons.MENU_WIDTH));
    this._menu.open('context', items, map, { x, y: Math.round(r.bottom + ChromeExtensionButtons.POPUP_GAP), width: ChromeExtensionButtons.MENU_WIDTH });
  }

  menuFor(ext, btn) {
    const pages = ext.pages || {};
    const items = [{ action: 'chrome-ext-open', label: `Open ${ext.name}` }];
    const map = { 'chrome-ext-open': () => this._open(ext, btn) };
    if (pages.options) {
      items.push({ action: 'chrome-ext-options', label: 'Options' });
      map['chrome-ext-options'] = () => this._invoke('core.chromeExtensions.openPage', ext.id, 'options');
    }
    items.push({ sep: true });
    items.push({ action: 'chrome-ext-disable', label: 'Disable' });
    map['chrome-ext-disable'] = () => this._change('core.chromeExtensions.toggle', ext.id, false);
    items.push({ action: 'chrome-ext-remove', label: 'Remove from LumaBrowser', danger: true });
    map['chrome-ext-remove'] = () => this._remove(ext);
    if (this._openSettings) {
      items.push({ sep: true });
      items.push({ action: 'chrome-ext-manage', label: 'Manage extensions' });
      map['chrome-ext-manage'] = () => this._openSettings();
    }
    return { items, map };
  }

  async _remove(ext) {
    if (!(await Dialogs.confirm(`Remove "${ext.name}"? Its files will be deleted.`, { okLabel: 'Remove', danger: true }))) return;
    await this._change('core.chromeExtensions.remove', ext.id);
  }

  async _change(channel, ...args) {
    const result = await this._invoke(channel, ...args);
    if (result && result.success === false) console.warn(`[chrome-ext] ${channel}: ${result.error || 'failed'}`);
    await this.refresh();
    document.dispatchEvent(new CustomEvent(ChromeExtensionButtons.MODIFIED_EVENT));
  }

  async _invoke(channel, ...args) {
    try {
      return await window.ipcBridge.invoke(channel, ...args);
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async _open(ext, btn) {
    const rect = btn.getBoundingClientRect();
    const at = { x: Math.round(rect.right), y: Math.round(rect.bottom + ChromeExtensionButtons.POPUP_GAP) };
    const result = await this._invoke('core.chromeExtensions.openPage', ext.id, 'popup', at);
    if (result && result.success === false) console.warn(`[chrome-ext] ${ext.name}: ${result.error || 'could not open its popup'}`);
  }
}
