import ByteFormatter from '../format/ByteFormatter.js';
import HtmlEscaper from '../format/HtmlEscaper.js';
import Dom from '../dom/Dom.js';
import AutoImageChoice from '../setup/AutoImageChoice.js';
import ExistingImagePlan from '../setup/ExistingImagePlan.js';
import HardwareText from '../setup/HardwareText.js';
import QuantText from '../setup/QuantText.js';
import ExistingLibraries from './ExistingLibraries.js';
import LoadingSteps from './LoadingSteps.js';
import StorageLine from './StorageLine.js';

export default class AutoPlanView {
  static async render(w, body) {
    const A = w.state.auto;
    if (!A.plan && !(await AutoPlanView._loadPlan(w, body))) return;
    AutoPlanView._card(w, body, A.plan);
  }

  static async _loadPlan(w, body) {
    const A = w.state.auto;
    LoadingSteps.mount(body, ['Reading your hardware', 'Choosing models', 'Preparing the plan'], w.timers);
    let result;
    try { result = await w.api().planAutoSetup({ wantImage: A.wantImage, wantMusic: !!A.wantMusic }); } catch (e) { result = { success: false, error: e.message }; }
    if (!w.state || w.state.mode !== 'auto' || A.view !== 'plan') return false;
    if (!result || !result.success || !result.plan || !result.plan.llm) {
      A.error = 'Couldn’t build an automatic plan: ' + ((result && result.error) || 'no model fits this machine');
      A.view = 'error';
      w.render();
      return false;
    }
    A.plan = result.plan;
    A.basePlan = result.plan;
    A.imageScan = null;
    w.state.hw = result.hardware || w.state.hw;
    w.timers.clear();
    body.innerHTML = '';
    return true;
  }

  static downloadLine(plan) {
    const total = plan.llm.approxBytes
      + ((plan.image && plan.image.approxTotalBytes) || 0)
      + ((plan.music && plan.music.approxTotalBytes) || 0);
    const have = Math.min(total, Number(plan.onDisk && plan.onDisk.totalBytes) || 0);
    if (have <= 0) return { total, text: '~' + ByteFormatter.gb(total) + ' total download' };
    if (have >= total) return { total, text: 'Already downloaded, nothing more to fetch' };
    return { total, text: '~' + ByteFormatter.gb(total - have) + ' left to download (already have ' + ByteFormatter.gb(have) + ' of ' + ByteFormatter.gb(total) + ')' };
  }

  static _card(w, body, plan) {
    const download = AutoPlanView.downloadLine(plan);
    const card = Dom.el('div', 'wz-rec');
    card.innerHTML = AutoPlanView.html(plan, download.text, w.state.hw);
    StorageLine.mount(card.querySelector('.wz-storage'), download.total, w.api());
    ExistingLibraries.mount(w, card.querySelector('.wz-existing-host'), () => ({
      runtimeId: plan.llm.runtimeId, contextSize: plan.llm.contextSize, kvCacheType: plan.llm.kvCacheType,
    }));
    AutoPlanView._mountImageChoice(w, card.querySelector('.wz-auto-image-choice'));
    card.querySelector('[data-auto-go]').addEventListener('click', () => w.autoFlow.run());
    card.querySelector('[data-auto-guided]').addEventListener('click', () => w.startGuided());
    body.appendChild(card);
  }

  static html(plan, downloadText, hw) {
    const esc = HtmlEscaper.escape;
    const hwLine = HardwareText.hardwareLine(hw);
    return '<div class="wz-rec-head">Picked for your hardware</div>'
      + '<div class="wz-rec-name">' + esc(plan.llm.label) + ' <span class="wz-rec-q" title="'
      + esc(QuantText.title(plan.llm.quant)) + '">' + esc(plan.llm.quant) + '</span></div>'
      + '<div class="wz-rec-meta">' + esc(downloadText) + '</div>'
      + '<ul class="wz-rec-why" style="margin:10px 0 0;padding-left:18px;">'
      + (plan.summary || []).map((s) => '<li>' + esc(s) + '</li>').join('')
      + '</ul>'
      + (hwLine ? '<div class="wz-rec-hw">' + esc(hwLine) + '</div>' : '')
      + '<div class="wz-auto-image-choice"></div>'
      + '<div class="wz-existing-host"></div>'
      + '<div class="wz-storage"></div>'
      + '<button class="luma-btn primary luma-btn--block wz-go" data-auto-go type="button">Set it up</button>'
      + '<button class="luma-btn link wz-back-link" data-auto-guided type="button">Customize instead</button>';
  }

  static async _mountImageChoice(w, host) {
    const A = w.state.auto;
    const api = w.imageApi();
    if (!host || !A.plan || !A.plan.image || !api || !api.scanExistingLibraries) return;
    if (!A.imageScan) {
      let scan;
      try { scan = await api.scanExistingLibraries(); } catch (_) { scan = { success: false }; }
      if (!w.state || w.state.mode !== 'auto' || w.state.auto !== A) return;
      A.imageScan = scan || { success: false };
      if (A.view !== 'plan' || !host.isConnected) return;
    }
    AutoImageChoice.mount(host, {
      scan: A.imageScan,
      plan: A.plan,
      className: 'wz-dim',
      onChange: (found) => {
        const base = A.basePlan || A.plan;
        A.plan = found ? ExistingImagePlan.withExisting(base, found) : base;
        w.render();
      },
    });
  }
}
