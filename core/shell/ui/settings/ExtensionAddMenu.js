export default class ExtensionAddMenu {
  static MARKUP = `
      <button type="button" class="settings-subtab-add" id="extAddBtn" title="Add an extension" aria-label="Add an extension" aria-haspopup="menu" aria-expanded="false">+</button>
      <div class="settings-add-menu" id="extAddMenu" role="menu" hidden>
        <button type="button" role="menuitem" id="ext-new-btn">New Extension</button>
        <button type="button" role="menuitem" id="ext-install-btn">Install from .zip</button>
      </div>
    `;

  constructor({ host, onNewExtension, onInstallZip }) {
    this._host = host;
    this._onNewExtension = onNewExtension;
    this._onInstallZip = onInstallZip;
    this._button = null;
    this._menu = null;
    this._onDocumentClick = (e) => { if (!this._host.contains(e.target)) this.close(); };
    this._onKeyDown = (e) => { if (e.key === 'Escape') this.close(); };
  }

  mount() {
    if (!this._host) return;
    this._host.innerHTML = ExtensionAddMenu.MARKUP;
    this._button = this._host.querySelector('#extAddBtn');
    this._menu = this._host.querySelector('#extAddMenu');
    this._button.addEventListener('click', () => this.toggle());
    this._item('#ext-new-btn', this._onNewExtension);
    this._item('#ext-install-btn', this._onInstallZip);
  }

  isOpen() {
    return !!this._menu && !this._menu.hidden;
  }

  toggle() {
    if (this.isOpen()) this.close();
    else this.open();
  }

  open() {
    if (!this._menu || this.isOpen()) return;
    this._menu.hidden = false;
    this._button.setAttribute('aria-expanded', 'true');
    document.addEventListener('click', this._onDocumentClick, true);
    document.addEventListener('keydown', this._onKeyDown);
  }

  close() {
    if (!this._menu || !this.isOpen()) return;
    this._menu.hidden = true;
    this._button.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', this._onDocumentClick, true);
    document.removeEventListener('keydown', this._onKeyDown);
  }

  _item(selector, handler) {
    this._menu.querySelector(selector).addEventListener('click', () => {
      this.close();
      handler();
    });
  }
}
