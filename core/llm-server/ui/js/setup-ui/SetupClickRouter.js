export default class SetupClickRouter {
  constructor(ctx, parts) {
    this._ctx = ctx;
    this._parts = parts;
  }

  start() {
    const body = this._ctx.doc.body;
    body.addEventListener('click', (e) => this.onClick(e.target));
    body.addEventListener('change', (e) => this.onChange(e.target));
    body.addEventListener('keydown', (e) => this.onKeydown(e));
  }

  async onClick(target) {
    if (!target || !target.closest) return;
    if (this._parts.rows.handleClick(target, this._ctx.doc)) return;
    if (this._hostFix(target)) return;
    if (await this._directory(target)) return;
    if (this._fitOrGambit(target)) return;
    const runtimeBtn = target.closest('[data-runtime-action]');
    if (runtimeBtn) {
      this._parts.runtimeActions.trigger(runtimeBtn.dataset.runtimeAction, runtimeBtn.dataset.runtimeId, runtimeBtn.dataset.runtimeUrl);
      return;
    }
    if (await this._parts.rename.handleClick(target)) return;
    const head = target.closest('.runtime-head');
    const row = head && head.closest('.runtime-row');
    if (row) row.classList.toggle('collapsed');
  }

  onChange(target) {
    if (target && target.id === 'modelsPathInput') this._ctx.cards.models.applyDirChange((target.value || '').trim() || null);
  }

  onKeydown(e) {
    if (e.key !== 'Enter') return;
    const target = e.target;
    if (target && target.id === 'modelsPathInput') {
      e.preventDefault();
      target.blur();
      return;
    }
    this._parts.rename.handleEnter(target, e);
  }

  _hostFix(target) {
    const fixes = this._parts.hostFixes;
    const fix = target.closest('[data-fix-path]');
    if (fix) { fixes.applyPathFix(fix); return true; }
    const recover = target.closest('[data-recover-gpu]');
    if (recover) { fixes.recoverGpu(recover); return true; }
    const aspm = target.closest('[data-aspm-off]');
    if (aspm) { fixes.setAspmOff(aspm); return true; }
    const copy = target.closest('[data-copy-cmd]');
    if (copy) { fixes.copyCommand(copy); return true; }
    if (target.closest('[data-dismiss-hint]')) { fixes.dismissPathHint(); return true; }
    return false;
  }

  async _directory(target) {
    if (target.closest('[data-open-model-search]')) {
      const search = this._parts.modelSearch;
      if (search && typeof search.open === 'function') search.open();
      return true;
    }
    if (target.closest('[data-pick-dir]')) { await this._pickDir(); return true; }
    if (target.closest('[data-reset-dir]')) {
      const input = this._ctx.doc.getElementById('modelsPathInput');
      if (input) input.value = '';
      this._ctx.cards.models.applyDirChange(null);
      return true;
    }
    return false;
  }

  async _pickDir() {
    const api = this._ctx.api;
    if (!api || !api.pickModelsDir) return;
    const res = await api.pickModelsDir();
    if (!(res && res.success && !res.canceled && res.dir)) return;
    const input = this._ctx.doc.getElementById('modelsPathInput');
    if (input) input.value = res.dir;
    this._ctx.cards.models.applyDirChange(res.dir);
  }

  _fitOrGambit(target) {
    const { fitTest, gambit } = this._ctx.cards;
    const fitBtn = target.closest('[data-fit-test]');
    if (fitBtn) { if (!fitBtn.disabled) fitTest.start(fitBtn.dataset.fitPath); return true; }
    if (target.closest('[data-fit-cancel]')) { fitTest.cancel(); return true; }
    const gamBtn = target.closest('[data-gam-test]');
    if (gamBtn) { if (!gamBtn.disabled) gambit.start(gamBtn.dataset.gamPath); return true; }
    if (target.closest('[data-gam-cancel]')) { gambit.cancel(); return true; }
    const gamDl = target.closest('[data-gam-download]');
    if (gamDl) { gambit.downloadRaw(gamDl.dataset.gamPath); return true; }
    const use = target.closest('[data-fit-use]');
    if (use) { fitTest.use(use.dataset.fitPath, Number(use.dataset.fitCtx), use.dataset.fitKv); return true; }
    return false;
  }
}
