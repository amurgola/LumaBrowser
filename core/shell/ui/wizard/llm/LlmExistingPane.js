import ByteFormatter from '../../../../llm-server/ui/js/format/ByteFormatter.js';
import HtmlEscaper from '../../../../llm-server/ui/js/format/HtmlEscaper.js';
import ExistingLibraryView from '../../../../llm-server/ui/js/setup/ExistingLibraryView.js';

export default class LlmExistingPane {
  static SCAN_CHANNEL = 'core.llmServer.scanExistingLibraries';

  static LIMIT = 12;

  constructor(wizard, step) {
    this._w = wizard;
    this._step = step;
  }

  async render(pane) {
    const L = this._w.state.llm.local;
    if (!L.existing) {
      pane.innerHTML = `<div class="setup-wizard__callout">Looking for models from LM Studio, Ollama and the Hugging Face cache…</div>`;
      const r = await this._scan();
      if (this._w.state.llm.mode !== 'local' || L.view !== 'existing') return;
      L.existing = (r && r.success) ? { models: r.models || [], sources: r.sources || {} } : { models: [], sources: {} };
    }
    const view = ExistingLibraryView.view(L.existing, { limit: LlmExistingPane.LIMIT });
    pane.innerHTML = view.models.length > 0 ? LlmExistingPane._foundHtml(view) : LlmExistingPane.NONE_FOUND;
    this._wire(pane, view);
  }

  async _scan() {
    try { return await window.ipcBridge.invoke(LlmExistingPane.SCAN_CHANNEL); } catch (e) { return { success: false, error: e.message }; }
  }

  static NONE_FOUND = `
        <div class="setup-wizard__callout">
          No LM Studio, Ollama or Hugging Face cache library was found on this machine.
          Pick a model to download, or point your models folder at your library later in Setup.
        </div>
        <div style="display:flex; gap:10px; margin-top:14px; align-items:center;">
          <button class="setup-wizard__btn setup-wizard__btn--primary" id="llmExistingDownload" type="button">Pick a model to download</button>
          <button class="setup-wizard__btn setup-wizard__btn--link" id="llmExistingRescan" type="button">Rescan</button>
        </div>`;

  static _foundHtml(view) {
    const esc = HtmlEscaper.escape;
    const count = view.models.length;
    const rows = view.shown.map((m, i) => `
            <div class="setup-wizard__rec setup-wizard__existing-row">
              <div class="setup-wizard__rec-name">${esc(m.name)}</div>
              <div class="setup-wizard__rec-meta">${esc(m.sourceLabel)} · ${ByteFormatter.gb(m.bytes)}</div>
              <div style="margin-top:8px;">
                <button class="setup-wizard__btn setup-wizard__btn--primary" type="button" data-existing="${i}">Use this one</button>
              </div>
            </div>`).join('');
    return `
        <div class="setup-wizard__subhead">You already have ${count} model${count === 1 ? '' : 's'} on this machine</div>
        <div class="setup-wizard__help">Found ${esc(view.bySource)}. Nothing is copied or moved: LumaBrowser links to the file where it already is.</div>
        <div class="setup-wizard__existing-list">${rows}</div>
        ${view.more > 0 ? `<div class="setup-wizard__help">...and ${view.more} more. Point your models folder at that library in Setup to use them all.</div>` : ''}
        <div style="display:flex; gap:10px; margin-top:14px; align-items:center;">
          <button class="setup-wizard__btn setup-wizard__btn--secondary" id="llmExistingDownload" type="button">Download a model from the catalog instead</button>
          <button class="setup-wizard__btn setup-wizard__btn--link" id="llmExistingRescan" type="button">Rescan</button>
        </div>`;
  }

  _wire(pane, view) {
    const L = this._w.state.llm.local;
    pane.querySelectorAll('[data-existing]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const picked = view.shown[Number(btn.getAttribute('data-existing'))];
        if (picked) this._step.runner.runImport(picked);
      });
    });
    pane.querySelector('#llmExistingDownload').addEventListener('click', () => {
      L.view = 'questions';
      L.rec = null;
      this._step.render();
    });
    pane.querySelector('#llmExistingRescan').addEventListener('click', () => {
      L.existing = null;
      this._step.render();
    });
  }
}
