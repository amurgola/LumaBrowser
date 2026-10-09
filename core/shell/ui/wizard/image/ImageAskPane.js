import ByteFormatter from '../../../../llm-server/ui/js/format/ByteFormatter.js';
import HtmlEscaper from '../../../../llm-server/ui/js/format/HtmlEscaper.js';
import ExistingLibraryView from '../../../../llm-server/ui/js/setup/ExistingLibraryView.js';

export default class ImageAskPane {
  static SCAN_CHANNEL = 'core.imageServer.scanExistingLibraries';

  static LIMIT = 8;

  constructor(wizard, step) {
    this._w = wizard;
    this._step = step;
  }

  render(pane) {
    const I = this._w.state.image;
    pane.innerHTML = ImageAskPane._cardsHtml(I.skipped);
    this._existingBlock(pane.querySelector('#imgExistingHost'));
    pane.querySelector('[data-img-act="install"]').addEventListener('click', () => this._recommend(null));
    pane.querySelector('[data-img-act="skip"]').addEventListener('click', () => {
      Object.assign(I, { skipped: true, resolved: true, done: false });
      this._w.renderFooter();
    });
  }

  static _cardsHtml(skipped) {
    return `
        <div id="imgExistingHost"></div>
        <div class="setup-wizard__card-grid">
          <button class="setup-wizard__card" type="button" data-img-act="install">
            <div class="setup-wizard__card-title">
              Set it up
              <span class="setup-wizard__card-badge">Recommended for creators</span>
            </div>
            <div class="setup-wizard__card-desc">
              Install the best image runtime for your hardware and download the
              best curated model that fits your GPU. Takes a few minutes.
            </div>
          </button>
          <button class="setup-wizard__card${skipped ? ' setup-wizard__card--selected' : ''}" type="button" data-img-act="skip">
            <div class="setup-wizard__card-title">
              Skip for now
              <span class="setup-wizard__card-badge">No download</span>
            </div>
            <div class="setup-wizard__card-desc">
              Continue without image generation. You can enable it any time from
              the LLM tab → Image section.
            </div>
          </button>
        </div>
      `;
  }

  _recommend(found) {
    Object.assign(this._w.state.image, { found, skipped: false, resolved: false, rec: null, error: null, view: 'recommend' });
    this._step.render();
    this._w.renderFooter();
  }

  async _existingBlock(host) {
    const I = this._w.state.image;
    if (!host) return;
    if (!I.existing) {
      let r;
      try { r = await window.ipcBridge.invoke(ImageAskPane.SCAN_CHANNEL); } catch (e) { r = { success: false, error: e.message }; }
      I.existing = (r && r.success) ? { models: r.models || [], sources: r.sources || {} } : { models: [], sources: {} };
      if (this._w.currentStepId() !== 'image' || I.view !== 'ask' || !host.isConnected) return;
    }
    const view = ExistingLibraryView.view(I.existing, { limit: ImageAskPane.LIMIT });
    if (!view.models.length) return;
    host.innerHTML = ImageAskPane._existingHtml(view);
    host.querySelectorAll('[data-img-existing]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const picked = view.shown[Number(btn.getAttribute('data-img-existing'))];
        if (picked) this._recommend(picked);
      });
    });
  }

  static _existingHtml(view) {
    const esc = HtmlEscaper.escape;
    const count = view.models.length;
    const rows = view.shown.map((m, i) => `
            <div class="setup-wizard__rec setup-wizard__existing-row">
              <div class="setup-wizard__rec-name">${esc(m.name)}</div>
              <div class="setup-wizard__rec-meta">${esc(m.sourceLabel)} · ${esc(m.archLabel || '')} · ${ByteFormatter.gb(m.bytes)}</div>
              <div style="margin-top:8px;">
                <button class="setup-wizard__btn setup-wizard__btn--primary" type="button" data-img-existing="${i}">Use this one</button>
              </div>
            </div>`).join('');
    return `
        <div class="setup-wizard__subhead">You already have ${count} image model${count === 1 ? '' : 's'} on this machine</div>
        <div class="setup-wizard__help">Found ${esc(view.bySource)}. Nothing is copied or moved: LumaBrowser links to the file where it already is.</div>
        <div class="setup-wizard__existing-list">${rows}</div>
        ${view.more > 0 ? `<div class="setup-wizard__help">...and ${view.more} more. Link the rest later from the LLM tab's Image section.</div>` : ''}
        <div class="setup-wizard__subhead" style="margin-top:16px;">Or start fresh</div>`;
  }
}
