import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class ModelRename {
  constructor(ctx) {
    this._ctx = ctx;
  }

  async handleClick(target) {
    const pencil = target.closest('[data-rename-model]');
    if (pencil) { this.begin(pencil); return true; }
    const save = target.closest('[data-rename-save]');
    if (save) { await this.save(save); return true; }
    if (target.closest('[data-rename-cancel]')) { this._ctx.cards.models.render(); return true; }
    return false;
  }

  begin(pencil) {
    const head = pencil.closest('.model-row-head');
    if (!head) return;
    head.innerHTML = ModelRename.editorHtml(pencil.dataset.nameKey || '', pencil.dataset.cur || '');
    const input = head.querySelector('.model-rename-input');
    if (input) { input.focus(); input.select(); }
  }

  static editorHtml(key, current) {
    const esc = HtmlEscaper.escape;
    return `<input class="model-rename-input" type="text" value="${esc(current)}"`
      + ' placeholder="Display name (blank = auto)"'
      + ' style="flex:1;min-width:0;font:inherit;padding:3px 8px;border-radius:6px;'
      + 'border:1px solid var(--border, #2a3550);background:var(--bg-input, #0b1220);color:inherit;">'
      + `<button class="luma-btn primary luma-btn--sm" type="button" data-rename-save data-name-key="${esc(key)}">Save</button>`
      + '<button class="luma-btn luma-btn--sm" type="button" data-rename-cancel>Cancel</button>';
  }

  async save(button) {
    const api = this._ctx.api;
    const head = button.closest('.model-row-head');
    const input = head && head.querySelector('.model-rename-input');
    const key = button.dataset.nameKey || (head && head.dataset.nameKey) || '';
    if (key && api && api.setModelDisplayName) {
      button.disabled = true;
      try { await api.setModelDisplayName(key, input ? input.value : ''); } catch (_) {}
    }
    this._ctx.cards.models.render();
  }

  handleEnter(target, event) {
    if (!(target && target.classList && target.classList.contains('model-rename-input'))) return false;
    event.preventDefault();
    const head = target.closest('.model-row-head');
    const save = head && head.querySelector('[data-rename-save]');
    if (save) save.click();
    return true;
  }
}
