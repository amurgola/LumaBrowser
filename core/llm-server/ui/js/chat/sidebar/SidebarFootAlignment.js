export default class SidebarFootAlignment {
  constructor(ctx) {
    this._ctx = ctx;
    this._barSlack = 0;
    this._footSlack = 0;
  }

  install() {
    const { els } = this._ctx;
    if (typeof ResizeObserver !== 'function' || !els.composerBar) return;
    const ro = new ResizeObserver(() => this.sync());
    ro.observe(els.composerBar);
    const foot = els.sidebar.querySelector('.cm-side-foot');
    if (foot) ro.observe(foot);
    this.sync();
  }

  sync() {
    const { els } = this._ctx;
    const foot = els.sidebar && els.sidebar.querySelector('.cm-side-foot');
    if (!foot) return;
    const barH = els.composerBar.getBoundingClientRect().height;
    if (!(barH > 0)) { this._clear(foot); return; }
    const barNat = barH - this._barSlack;
    const footNat = foot.getBoundingClientRect().height - this._footSlack;
    const target = Math.max(barNat, footNat);
    if (!this._trayOut(foot)) this._setBar(Math.max(0, target - barNat));
    this._setFoot(foot, Math.max(0, target - footNat));
  }

  _clear(foot) {
    this._barSlack = 0;
    this._footSlack = 0;
    this._ctx.els.composerBar.style.removeProperty('--cm-bar-slack');
    foot.style.removeProperty('--cm-foot-slack');
  }

  _trayOut(foot) {
    const tray = foot.querySelector('.cm-settings-tray');
    return !!tray && tray.getBoundingClientRect().height > 4;
  }

  _setBar(next) {
    if (Math.abs(next - this._barSlack) <= 0.01) return;
    this._barSlack = next;
    this._ctx.els.composerBar.style.setProperty('--cm-bar-slack', next + 'px');
  }

  _setFoot(foot, next) {
    if (Math.abs(next - this._footSlack) <= 0.01) return;
    this._footSlack = next;
    foot.style.setProperty('--cm-foot-slack', next + 'px');
  }
}
