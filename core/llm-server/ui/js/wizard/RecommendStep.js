import ByteFormatter from '../format/ByteFormatter.js';
import HtmlEscaper from '../format/HtmlEscaper.js';
import Dom from '../dom/Dom.js';
import HardwareText from '../setup/HardwareText.js';
import QuantText from '../setup/QuantText.js';
import ExistingLibraries from './ExistingLibraries.js';
import HfSearchPanel from './HfSearchPanel.js';
import LlmSetupFlow from './LlmSetupFlow.js';
import LoadingSteps from './LoadingSteps.js';
import StorageLine from './StorageLine.js';

export default class RecommendStep {
  static STEP = 4;

  static async render(w, body) {
    LoadingSteps.mount(body, ['Reading your hardware', 'Choosing a model', 'Preparing the recommendation'], w.timers);
    let result;
    try { result = await w.api().recommendModel(w.state.answers); } catch (e) { result = { success: false, error: e.message }; }
    if (!w.state || w.state.step !== RecommendStep.STEP) return;
    body.innerHTML = '';
    if (!result || !result.success) {
      body.appendChild(Dom.el('div', 'luma-callout bad',
        'Couldn’t generate a recommendation: ' + HtmlEscaper.escape((result && result.error) || 'unknown error')));
      return;
    }
    w.state.rec = result.recommendation;
    w.state.hw = result.hardware;
    RecommendStep._card(w, body, w.state.rec);
  }

  static _card(w, body, rec) {
    const card = Dom.el('div', 'wz-rec');
    card.innerHTML = RecommendStep.html(rec, w.state.hw);
    card.querySelector('.wz-go').addEventListener('click', () => new LlmSetupFlow(w).run(body));
    body.appendChild(card);
    StorageLine.mount(card.querySelector('.wz-storage'), rec.approxBytes, w.api());
    ExistingLibraries.mount(w, card.querySelector('.wz-existing-host'), () => ({
      runtimeId: rec.runtimeId, contextSize: rec.contextSize, kvCacheType: rec.kvCacheType,
    }));
    new HfSearchPanel(w, card.querySelector('.wz-search'), w.isMac).mount();
  }

  static html(rec, hw) {
    const esc = HtmlEscaper.escape;
    return '<div class="wz-rec-head">Recommended for you</div>'
      + '<div class="wz-rec-name">' + esc(rec.label) + ' <span class="wz-rec-q" title="'
      + esc(QuantText.title(rec.quant)) + '">' + esc(rec.quant) + '</span></div>'
      + '<div class="wz-rec-meta">~' + ByteFormatter.gb(rec.approxBytes) + ' download · '
      + rec.contextSize.toLocaleString() + ' ctx · ' + esc(rec.runtimeId) + '</div>'
      + '<p class="wz-rec-why">' + esc(rec.rationale) + '</p>'
      + '<div class="wz-rec-hw">' + esc(HardwareText.hardwareLine(hw)) + '</div>'
      + RecommendStep._warning(rec.warnId)
      + '<details class="wz-adv"><summary>Advanced: browse HuggingFace for a specific model</summary>'
      + '<div class="wz-search"></div>'
      + '<input class="wz-adv-in" type="text" placeholder="…or paste a .gguf URL  (owner/repo/file.gguf)" />'
      + '<div class="wz-dim">Leave blank to use the recommendation above.</div></details>'
      + '<div class="wz-existing-host"></div>'
      + '<div class="wz-storage"></div>'
      + '<button class="luma-btn primary luma-btn--block wz-go" type="button">Download &amp; set up</button>';
  }

  static _warning(warnId) {
    if (!warnId) return '';
    return '<div class="luma-callout warn">'
      + (warnId === 'cpu-only'
        ? 'No usable GPU detected: this will run on CPU and may feel slow.'
        : 'This pick spills past VRAM into system RAM: capable, but slower.')
      + '</div>';
  }
}
