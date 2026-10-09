import ByteFormatter from '../../../../llm-server/ui/js/format/ByteFormatter.js';
import HtmlEscaper from '../../../../llm-server/ui/js/format/HtmlEscaper.js';
import HardwareText from '../../../../llm-server/ui/js/setup/HardwareText.js';
import QuantText from '../../../../llm-server/ui/js/setup/QuantText.js';

export default class LlmRecommendPane {
  static RECOMMEND_CHANNEL = 'core.llmServer.recommendModel';

  constructor(wizard, step) {
    this._w = wizard;
    this._step = step;
  }

  async render(pane) {
    const L = this._w.state.llm.local;
    if (!L.rec && !(await this._fetch(pane))) return;
    pane.innerHTML = LlmRecommendPane._html(L.rec, L.hw || {}, L.advanced);
    this._wire(pane);
  }

  async _fetch(pane) {
    const L = this._w.state.llm.local;
    pane.innerHTML = `<div class="setup-wizard__callout">Reading your hardware & choosing a model…</div>`;
    let r;
    try { r = await window.ipcBridge.invoke(LlmRecommendPane.RECOMMEND_CHANNEL, L.answers); } catch (e) { r = { success: false, error: e.message }; }
    if (this._w.state.llm.mode !== 'local' || L.view !== 'recommend') return false;
    if (!r || !r.success) {
      L.error = 'Couldn’t generate a recommendation: ' + ((r && r.error) || 'unknown error');
      L.view = 'error';
      this._step.render();
      return false;
    }
    L.rec = r.recommendation;
    L.hw = r.hardware;
    return true;
  }

  static _html(rec, hw, advanced) {
    const esc = HtmlEscaper.escape;
    return `
        <div class="setup-wizard__rec">
          <div class="setup-wizard__rec-head">Recommended for you</div>
          <div class="setup-wizard__rec-name">${esc(rec.label)}
            <span class="setup-wizard__card-badge" title="${esc(QuantText.title(rec.quant))}">${esc(rec.quant)}</span></div>
          <div class="setup-wizard__rec-meta">~${ByteFormatter.gb(rec.approxBytes)} download · ${
  rec.contextSize.toLocaleString()} ctx · ${esc(rec.runtimeId)}</div>
          <p class="setup-wizard__rec-why">${esc(rec.rationale)}</p>
          <div class="setup-wizard__rec-hw">${esc(HardwareText.hardwareLine(hw))}</div>
          ${LlmRecommendPane._warnHtml(rec.warnId)}
        </div>
        <details class="setup-wizard__adv">
          <summary>Advanced: use a specific HuggingFace model</summary>
          <input class="setup-wizard__input" id="llmAdvIn" type="text" style="margin-top:8px;"
            placeholder="https://huggingface.co/owner/repo/resolve/main/model.gguf  (or owner/repo/file.gguf)"
            value="${esc(advanced)}">
          <div class="setup-wizard__help">Leave blank to use the recommendation above.</div>
        </details>
        <div style="display:flex; gap:10px; margin-top:14px;">
          <button class="setup-wizard__btn setup-wizard__btn--primary" id="llmGoBtn" type="button">Download &amp; set up</button>
          <button class="setup-wizard__btn setup-wizard__btn--secondary" id="llmBackQ" type="button">Change answers</button>
        </div>
      `;
  }

  static _warnHtml(warnId) {
    if (!warnId) return '';
    const text = warnId === 'cpu-only'
      ? 'No usable GPU detected. This will run on the CPU and may feel slow.'
      : 'This pick spills past graphics memory into system RAM. Capable, but slower.';
    return `<div class="setup-wizard__status setup-wizard__status--info" style="margin-top:10px;">${text}</div>`;
  }

  _wire(pane) {
    const L = this._w.state.llm.local;
    const advIn = pane.querySelector('#llmAdvIn');
    if (advIn) advIn.addEventListener('input', () => { L.advanced = advIn.value.trim(); });
    pane.querySelector('#llmBackQ').addEventListener('click', () => { L.view = 'questions'; this._step.render(); });
    pane.querySelector('#llmGoBtn').addEventListener('click', () => this._step.runner.runSetup());
  }
}
