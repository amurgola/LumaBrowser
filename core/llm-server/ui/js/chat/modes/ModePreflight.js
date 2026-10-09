import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class ModePreflight {
  static LLM_MISSING = 'No language model is configured. Set one up in the Setup tab first.';

  static IMAGE_MISSING = 'No image model is configured. Set one up in Setup → Image, or connect to a host sharing one.';

  constructor(ctx) {
    this._ctx = ctx;
  }

  async run(reqs) {
    const missing = [];
    for (const r of (reqs || [])) {
      if (r === 'llm' && !(await this._llmReady())) missing.push({ requirement: 'llm', message: ModePreflight.LLM_MISSING });
      else if (r === 'image' && !(await this._imageReady())) missing.push({ requirement: 'image', message: ModePreflight.IMAGE_MISSING });
    }
    return { ok: missing.length === 0, missing };
  }

  showBlock(def, missing) {
    const esc = HtmlEscaper.escape;
    const back = Dom.el('div', 'cm-modal-back');
    const items = missing.map((m) => '<li>' + esc(m.message) + '</li>').join('');
    back.innerHTML = `<div class="cm-modal">
      <div class="cm-modal-title">${esc(def.label || def.id)} needs setup</div>
      <ul class="cm-preflight-list">${items}</ul>
      <div class="cm-modal-actions">
        <button class="cm-modal-btn" data-act="cancel">Close</button>
        <button class="cm-modal-btn primary" data-act="setup">Open Setup</button>
      </div></div>`;
    back.addEventListener('click', (e) => {
      if (e.target === back || e.target.closest('[data-act="cancel"]')) { back.remove(); return; }
      if (e.target.closest('[data-act="setup"]')) { back.remove(); this._ctx.switchToSetup(); }
    });
    (this._ctx.root || document.body).appendChild(back);
  }

  async _llmReady() {
    const api = this._ctx.api;
    try {
      const def = await api.getDefaults();
      if (def && def.runtimeId && def.modelPath) return true;
      const lm = await api.listModels();
      return !!(lm && lm.success && lm.models && lm.models.length);
    } catch (_) {
      return false;
    }
  }

  async _imageReady() {
    const api = this._ctx.api;
    try {
      if (api.image.isRoleReady) return !!(await api.image.isRoleReady('image-generate'));
      const en = await api.image.getEnabled();
      const d = await api.image.getDefaults();
      return !!(en && d && d.runtimeId && d.modelId);
    } catch (_) {
      return false;
    }
  }
}
