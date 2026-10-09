export default class ModeTheme {
  constructor(ctx) {
    this._ctx = ctx;
  }

  applyBackground(b64OrUrl, mime) {
    const main = this._ctx.els.main;
    if (!main) return;
    if (!b64OrUrl) { this.clear(); return; }
    const url = /^(data:|https?:|\/)/.test(b64OrUrl) ? b64OrUrl : 'data:' + (mime || 'image/png') + ';base64,' + b64OrUrl;
    main.classList.add('cm-has-bg');
    main.style.setProperty('--cm-bg-image', `url("${url}")`);
  }

  clear() {
    const main = this._ctx.els.main;
    if (!main) return;
    main.classList.remove('cm-has-bg');
    main.style.removeProperty('--cm-bg-image');
  }

  apply() {
    const { state, els } = this._ctx;
    const def = state.activeModeDef;
    if (def && typeof def.applyTheme === 'function') {
      try { def.applyTheme(els.main, state.activeMeta, this._ctx.modeCtx.forHooks()); return; } catch (_) {}
    }
    this.clear();
  }
}
