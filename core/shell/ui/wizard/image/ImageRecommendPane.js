import ByteFormatter from '../../../../llm-server/ui/js/format/ByteFormatter.js';
import HtmlEscaper from '../../../../llm-server/ui/js/format/HtmlEscaper.js';
import ImageModelBudget from '../../../../llm-server/ui/js/setup/ImageModelBudget.js';
import ImageRuntimePicker from '../../../../llm-server/ui/js/setup/ImageRuntimePicker.js';

export default class ImageRecommendPane {
  constructor(wizard, step) {
    this._w = wizard;
    this._step = step;
  }

  async render(pane) {
    const I = this._w.state.image;
    if (!I.rec && !(await this._resolve(pane))) return;
    pane.innerHTML = ImageRecommendPane._html(I.rec, I.found);
    pane.querySelector('#imgBackAsk').addEventListener('click', () => {
      I.view = 'ask';
      this._step.render();
      this._w.renderFooter();
    });
    pane.querySelector('#imgGoBtn').addEventListener('click', () => this._step.runner.run());
  }

  async _resolve(pane) {
    pane.innerHTML = `<div class="setup-wizard__callout">Reading your hardware & choosing an image model…</div>`;
    let view = null;
    let catalog = [];
    try {
      const rv = await window.ipcBridge.invoke('core.imageServer.getRuntimesView');
      view = (rv && rv.view) || null;
      const cat = await window.ipcBridge.invoke('core.imageServer.modelCatalog');
      catalog = (cat && cat.models) || [];
    } catch (e) {
      return this._fail('Image server is not available on this build: ' + ((e && e.message) || e));
    }
    if (!this._stillRecommending()) return false;
    if (!view || (catalog.length === 0 && !this._w.state.image.found)) {
      return this._fail('Couldn’t load the image catalog. You can set this up later from the Image tab.');
    }
    return this._pick(view, catalog);
  }

  async _pick(view, catalog) {
    const I = this._w.state.image;
    const runtime = ImageRuntimePicker.pick(view);
    const hw = await ImageRecommendPane._hardware();
    if (!this._stillRecommending()) return false;
    const model = I.found ? null : (ImageModelBudget.pickImageModel(catalog, hw) || catalog[0]);
    if (!runtime) return this._fail('No compatible image runtime for this platform.');
    I.rec = { runtime, model };
    return true;
  }

  static async _hardware() {
    try {
      const hr = await window.ipcBridge.invoke('core.llmServer.getWizardHardware');
      return (hr && hr.success && hr.hardware) || null;
    } catch (_) { return null; }
  }

  _stillRecommending() {
    return this._w.currentStepId() === 'image' && this._w.state.image.view === 'recommend';
  }

  _fail(message) {
    const I = this._w.state.image;
    I.error = message;
    I.view = 'error';
    this._step.render();
    return false;
  }

  static _html(rec, found) {
    return `
        <div class="setup-wizard__rec">${found ? ImageRecommendPane._foundCard(rec, found) : ImageRecommendPane._catalogCard(rec)}
          ${ImageRecommendPane._hardwareNote(rec.runtime)}
        </div>
        <div style="display:flex; gap:10px; margin-top:14px;">
          <button class="setup-wizard__btn setup-wizard__btn--primary" id="imgGoBtn" type="button">${found ? 'Link &amp; set up' : 'Download &amp; set up'}</button>
          <button class="setup-wizard__btn setup-wizard__btn--secondary" id="imgBackAsk" type="button">Back</button>
        </div>
      `;
  }

  static _foundCard(rec, found) {
    const esc = HtmlEscaper.escape;
    return `
          <div class="setup-wizard__rec-head">Your existing image model</div>
          <div class="setup-wizard__rec-name">${esc(found.name)}</div>
          <div class="setup-wizard__rec-meta">${esc(found.archLabel || '')} · ${ByteFormatter.gb(found.bytes)} · no model download · ${esc(rec.runtime.name || rec.runtime.id)}</div>
          <p class="setup-wizard__rec-why">Linked from ${esc(found.sourceLabel)}. The file stays where it is and takes no extra disk space.${rec.runtime.installed ? '' : ' Only the image runtime is downloaded.'}</p>`;
  }

  static _catalogCard(rec) {
    const esc = HtmlEscaper.escape;
    return `
          <div class="setup-wizard__rec-head">Recommended image setup</div>
          <div class="setup-wizard__rec-name">${esc(rec.model.label || rec.model.id)}</div>
          <div class="setup-wizard__rec-meta">~${ByteFormatter.gb(ImageRecommendPane._approxBytes(rec.model))} download · ${esc(rec.runtime.name || rec.runtime.id)}</div>
          <p class="setup-wizard__rec-why">${esc(rec.model.blurb || 'Local text-to-image generation.')}</p>`;
  }

  static _approxBytes(model) {
    if (!model || !model.files) return 0;
    return Object.keys(model.files).reduce((s, k) => s + ((model.files[k] && model.files[k].approxBytes) || 0), 0);
  }

  static _hardwareNote(runtime) {
    if (!runtime.hardware || runtime.hardware.ready) return '';
    return `<div class="setup-wizard__status setup-wizard__status--info" style="margin-top:10px;">${
      HtmlEscaper.escape(runtime.hardware.note || 'Selected runtime reports hardware not ready. It may run slowly or fail to start.')}</div>`;
  }
}
