import MenuHtml from './MenuHtml.js';

export default class PopupMenu {
  constructor({ host }) {
    this._host = host;
    this._choose = () => {};
    this._reset();
    host.onHide(() => this._reset());
  }

  bindChooser(choose) {
    this._choose = choose;
  }

  open(mode, items, actionMap, { x, y, width = 220 }) {
    this._host.hide();
    const { html, actions } = MenuHtml.render(items);
    this.actions = actions;
    this.actionMap = actionMap;
    this.active = -1;
    this._host.show(mode, {
      html: `${MenuHtml.STYLE}<div class="bd-context-menu">${html}</div>`,
      x, y, width, estHeight: items.length * 34 + 12,
    });
    this._host.armDismiss();
  }

  openFolder(children, html, { x, y, width, estHeight }) {
    this._host.hide();
    this.folderChildren = children;
    this.active = -1;
    this._host.show('folder', { html, x, y, width, estHeight });
    this._host.armDismiss();
  }

  folderChild(index) {
    return this.folderChildren[index];
  }

  runAction(action) {
    const fn = this.actionMap && this.actionMap[action];
    this._host.hide();
    if (fn) fn();
  }

  setActive(index) {
    this.active = index;
    PopupMenu._highlight(index);
  }

  handleKeydown(e) {
    if (!this._host.isMenuOpen()) return false;
    const count = this._host.mode === 'folder' ? this.folderChildren.length : this.actions.length;
    if (e.key === 'Escape') { this._host.hide(); return true; }
    if (!count) return false;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') return this._step(e.key === 'ArrowDown' ? 1 : -1, count);
    if (e.key === 'Home' || e.key === 'End') return this._jump(e.key === 'Home' ? 0 : count - 1);
    if (e.key === 'Enter' || e.key === ' ') return this._pick();
    return false;
  }

  _step(dir, count) {
    this.active = this.active < 0 ? (dir > 0 ? 0 : count - 1) : (this.active + dir + count) % count;
    PopupMenu._highlight(this.active);
    return true;
  }

  _jump(index) {
    this.active = index;
    PopupMenu._highlight(index);
    return true;
  }

  _pick() {
    if (this.active < 0) return true;
    if (this._host.mode === 'folder') this._choose({ action: 'open', index: this.active });
    else this._choose({ action: this.actions[this.active] });
    return true;
  }

  static _highlight(index) {
    if (window.chromeOverlayAPI) window.chromeOverlayAPI.setActive(index);
  }

  _reset() {
    this.actions = [];
    this.active = -1;
    this.actionMap = null;
    this.folderChildren = [];
  }
}
