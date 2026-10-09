export default class OverlayActionRouter {
  constructor(deps) {
    this._d = deps;
  }

  install() {
    if (!window.chromeOverlayAPI) return;
    window.chromeOverlayAPI.onAction((p) => this.handleAction(p));
    window.chromeOverlayAPI.onHover((p) => this.handleHover(p));
  }

  handleAction(payload) {
    if (!payload) return;
    const d = this._d;
    d.host.cancelBlurHide();
    if (payload.layer === 'perm') { d.prompts.handleAction(payload); return; }
    if ((payload.layer || payload.id) === 'notif') {
      if (payload.action === 'close-log') d.log.hide();
      return;
    }
    this._popupAction(payload);
  }

  handleHover(payload) {
    const d = this._d;
    if (payload && (payload.layer || payload.id) === 'notif') { d.log.setHovered(payload.hovering); return; }
    if (payload && payload.id && payload.id !== 'popup') return;
    if (!payload || payload.index == null) return;
    if (d.host.mode === 'suggestions') d.autocomplete.setActive(payload.index);
    else if (d.host.isMenuOpen()) d.popupMenu.setActive(payload.index);
  }

  _popupAction(payload) {
    const d = this._d;
    const mode = d.host.mode;
    if (mode === 'suggestions' && payload.action === 'commit') {
      d.autocomplete.commit(payload.index);
    } else if (mode === 'folder' && payload.action === 'open') {
      d.folderMenu.pick(payload.index, d.host);
    } else if (mode === 'context' || mode === 'settings-menu') {
      if (d.downloads.menuOpen) { d.downloads.handleAction(payload); return; }
      d.popupMenu.runAction(payload.action);
    }
  }
}
