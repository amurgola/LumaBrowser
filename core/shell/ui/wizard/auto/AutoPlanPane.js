import ByteFormatter from '../../../../llm-server/ui/js/format/ByteFormatter.js';
import HtmlEscaper from '../../../../llm-server/ui/js/format/HtmlEscaper.js';
import AutoImageChoice from '../../../../llm-server/ui/js/setup/AutoImageChoice.js';
import ExistingImagePlan from '../../../../llm-server/ui/js/setup/ExistingImagePlan.js';
import HardwareText from '../../../../llm-server/ui/js/setup/HardwareText.js';
import QuantText from '../../../../llm-server/ui/js/setup/QuantText.js';
import PlanText from '../PlanText.js';

export default class AutoPlanPane {
  static PLAN_CHANNEL = 'core.llmServer.planAutoSetup';

  static STORAGE_CHANNEL = 'core.llmServer.getStorageInfo';

  static IMAGE_SCAN_CHANNEL = 'core.imageServer.scanExistingLibraries';

  constructor(wizard, step) {
    this._w = wizard;
    this._step = step;
  }

  async render(pane) {
    const A = this._w.state.auto;
    if (!A.plan && !(await this._fetchPlan(pane))) return;
    const totals = AutoPlanPane._totals(A.plan);
    pane.innerHTML = this._html(A.plan, totals);
    this._wire(pane);
    this._imageChoice(pane.querySelector('#autoImageChoice'));
    this._fillStorageLine(pane, Math.max(0, totals.dl - totals.have));
  }

  async _fetchPlan(pane) {
    const A = this._w.state.auto;
    pane.innerHTML = `<div class="setup-wizard__callout">Reading your hardware and choosing models…</div>`;
    let r;
    try { r = await window.ipcBridge.invoke(AutoPlanPane.PLAN_CHANNEL, { wantImage: A.wantImage, wantMusic: !!A.wantMusic }); } catch (e) { r = { success: false, error: e.message }; }
    if (this._w.currentStepId() !== 'auto' || A.view !== 'plan') return false;
    if (!r || !r.success || !r.plan || !r.plan.llm) {
      A.error = 'Could not build an automatic plan: ' + ((r && r.error) || 'no model fits this machine');
      A.view = 'error';
      this._step.render();
      return false;
    }
    A.plan = r.plan;
    A.basePlan = r.plan;
    A.imageScan = null;
    A.hw = r.hardware || A.hw;
    return true;
  }

  static _totals(plan) {
    const dl = plan.llm.approxBytes
      + ((plan.image && plan.image.approxTotalBytes) || 0)
      + ((plan.music && plan.music.approxTotalBytes) || 0);
    return { dl, have: Math.min(dl, Number(plan.onDisk && plan.onDisk.totalBytes) || 0) };
  }

  _html(plan, totals) {
    const esc = HtmlEscaper.escape;
    const plain = this._w.isPlainCopy();
    const quantBadge = plain ? ''
      : `<span class="setup-wizard__card-badge" title="${esc(QuantText.title(plan.llm.quant))}">${esc(plan.llm.quant)}</span>`;
    const hwLine = HardwareText.hardwareLine(this._w.state.auto.hw);
    const summaryHtml = PlanText.summaryLines(plan.summary, plain).map((s) => `<li>${esc(s)}</li>`).join('');
    return `
        <div class="setup-wizard__rec">
          ${AutoPlanPane._tierHtml(plan.tier)}
          <div class="setup-wizard__rec-name">${esc(plan.llm.label)} ${quantBadge}</div>
          <div class="setup-wizard__rec-meta">${PlanText.downloadLine(totals.dl, totals.have, ByteFormatter.gb)}</div>
          <div class="setup-wizard__rec-meta" id="autoStorageLine"></div>
          <ul class="setup-wizard__rec-why" style="margin:10px 0 0; padding-left:18px;">${summaryHtml}</ul>
          <div id="autoImageChoice"></div>
          ${hwLine ? `<div class="setup-wizard__rec-hw">${esc(hwLine)}</div>` : ''}
        </div>
        <div style="display:flex; gap:10px; margin-top:14px; align-items:center;">
          <button class="setup-wizard__btn setup-wizard__btn--primary" id="autoGoBtn" type="button">Set it up</button>
          ${this._secondaryHtml()}
          <button class="setup-wizard__btn setup-wizard__btn--link" id="autoToGuided" type="button">Customize instead</button>
        </div>
      `;
  }

  static _tierHtml(tier) {
    const esc = HtmlEscaper.escape;
    return tier
      ? `<div class="setup-wizard__rec-head">${esc(tier.name)}: ${esc(tier.whatYouGet)}</div>`
      : `<div class="setup-wizard__rec-head">Picked for your hardware</div>`;
  }

  _secondaryHtml() {
    if (this._w.state.persona !== 'chat') return `<button class="setup-wizard__btn setup-wizard__btn--secondary" id="autoBackBtn" type="button">Change answer</button>`;
    return this._w.state.auto.wantImage
      ? `<button class="setup-wizard__btn setup-wizard__btn--secondary" id="autoNoImages" type="button">Chat only</button>`
      : `<button class="setup-wizard__btn setup-wizard__btn--secondary" id="autoAddImages" type="button">Add image generation</button>`;
  }

  _wire(pane) {
    const on = (id, fn) => { const el = pane.querySelector(`#${id}`); if (el) el.addEventListener('click', fn); };
    on('autoGoBtn', () => this._step.runner.run());
    on('autoBackBtn', () => this._replan({ view: 'question' }));
    on('autoAddImages', () => this._replan({ wantImage: true }));
    on('autoNoImages', () => this._replan({ wantImage: false }));
    on('autoToGuided', () => {
      this._w.state.flow = 'guided';
      this._w.jumpTo('workflow');
    });
  }

  _replan(patch) {
    Object.assign(this._w.state.auto, patch, { plan: null });
    this._step.render();
  }

  async _imageChoice(host) {
    const A = this._w.state.auto;
    if (!host || !A.plan || !A.plan.image) return;
    if (!A.imageScan) {
      let r;
      try { r = await window.ipcBridge.invoke(AutoPlanPane.IMAGE_SCAN_CHANNEL); } catch (_) { r = { success: false }; }
      A.imageScan = r || { success: false };
      if (this._w.currentStepId() !== 'auto' || A.view !== 'plan' || !host.isConnected) return;
    }
    AutoImageChoice.mount(host, {
      scan: A.imageScan,
      plan: A.plan,
      className: 'setup-wizard__help',
      onChange: (found) => {
        const base = A.basePlan || A.plan;
        A.plan = found ? ExistingImagePlan.withExisting(base, found) : base;
        this._step.render();
      },
    });
  }

  _fillStorageLine(pane, needBytes) {
    Promise.resolve(window.ipcBridge.invoke(AutoPlanPane.STORAGE_CHANNEL)).then((r) => {
      const el = pane.querySelector('#autoStorageLine');
      if (!el || !r || !r.success) return;
      const free = Number(r.freeBytes) || 0;
      if (!(free > 0)) return;
      const tight = needBytes > 0 && free < needBytes * 1.1;
      el.textContent = `Needs ${ByteFormatter.gb(needBytes)} of disk space, you have ${ByteFormatter.gb(free)} free`
        + (tight ? '. That is not enough: free some space or choose a smaller setup.' : '.');
      if (tight) el.classList.add('setup-wizard__rec-meta--warn');
    }).catch(() => {});
  }
}
