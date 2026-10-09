import HtmlEscaper from '../format/HtmlEscaper.js';
import Dom from '../dom/Dom.js';
import AutoSetupFlow from './AutoSetupFlow.js';
import GuidedSteps from './GuidedSteps.js';
import HostPlatform from './HostPlatform.js';
import ImageStep from './ImageStep.js';
import RecommendStep from './RecommendStep.js';
import WizardState from './WizardState.js';
import WizardTimers from './WizardTimers.js';

export default class EasySetupWizard {
  static STEP_TITLES = ['Welcome', 'How will you use it?', 'Speed tolerance', 'Context length', 'Your recommendation', 'Image generation'];

  static STEPS = [GuidedSteps.welcome, GuidedSteps.useCase, GuidedSteps.speed, GuidedSteps.context, RecommendStep.render, ImageStep.render];

  constructor(opts) {
    const options = opts || {};
    this._getRoot = options.getApi || (() => window.llmDiagAPI);
    this._nav = options.nav || (typeof navigator !== 'undefined' ? navigator : {});
    this.isMac = HostPlatform.isMac(this._nav);
    this.overlay = null;
    this.state = null;
    this.timers = new WizardTimers();
    this.autoFlow = new AutoSetupFlow(this);
    this._observer = null;
  }

  root() {
    return this._getRoot();
  }

  api() {
    return this._getRoot();
  }

  imageApi() {
    const root = this._getRoot();
    return root && root.image;
  }

  musicOffered() {
    return !HostPlatform.isMacPlatform(this._nav);
  }

  install() {
    if (this._installed) return;
    this._installed = true;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => this._watchForReinject());
    else this._watchForReinject();
  }

  open() {
    if (!this.overlay) this._buildOverlay();
    this.state = WizardState.initial();
    this.overlay.hidden = false;
    this.render();
  }

  close() {
    this.timers.clear();
    if (this.overlay) this.overlay.hidden = true;
    this.state = null;
  }

  goChat() {
    this.close();
    window.dispatchEvent(new CustomEvent('luma-switch-mode', { detail: 'chat' }));
  }

  startGuided() {
    this.state.mode = 'guided';
    this.state.step = 1;
    this.render();
  }

  body() {
    return this.overlay.querySelector('.wz-body');
  }

  setCloseDisabled(disabled) {
    this.overlay.querySelector('.wz-x').disabled = disabled;
  }

  render() {
    if (this.state.mode === 'auto') return this.autoFlow.render();
    this._paintSteps();
    const body = this.body();
    this.timers.clear();
    body.innerHTML = '';
    EasySetupWizard.STEPS[this.state.step](this, body);
    this._paintFoot();
    return undefined;
  }

  stepAnswered() {
    const { step, answers } = this.state;
    if (step === 1) return !!answers.useCase;
    if (step === 2) return !!answers.tkPref;
    if (step === 3) return !!answers.ctxPref;
    return true;
  }

  _paintSteps() {
    const step = this.state.step;
    const dots = EasySetupWizard.STEP_TITLES.map((t, i) => `<span class="wz-dot${i === step ? ' on' : ''}${i < step ? ' done' : ''}"></span>`).join('');
    this.overlay.querySelector('.wz-steps').innerHTML = dots
      + '<span class="wz-step-name">' + HtmlEscaper.escape(EasySetupWizard.STEP_TITLES[step]) + '</span>';
  }

  _paintFoot() {
    const step = this.state.step;
    const back = this.overlay.querySelector('.wz-back');
    const next = this.overlay.querySelector('.wz-next');
    back.onclick = null;
    back.style.visibility = (step === 0 || step === 5 || (step === 4 && this.state.llmDone)) ? 'hidden' : 'visible';
    next.hidden = step === 0 || step === 4 || step === 5;
    next.disabled = !this.stepAnswered();
    next.textContent = step === 3 ? 'See recommendation' : 'Next';
  }

  _onNext() {
    if (!this.stepAnswered() || this.state.busy) return;
    if (this.state.step < 4) { this.state.step++; this.render(); }
  }

  _onBack() {
    if (this.overlay.querySelector('.wz-back').onclick) return;
    if (this.state.step > 0 && !this.state.busy) { this.state.step--; this.render(); }
  }

  _buildOverlay() {
    this.overlay = Dom.el('div', 'luma-modal-overlay wz-overlay');
    this.overlay.hidden = true;
    this.overlay.innerHTML = '<div class="luma-modal wz-modal">'
      + '<button class="luma-icon-btn luma-icon-btn--sq luma-modal-x wz-x" title="Close" aria-label="Close"></button>'
      + '<div class="wz-steps"></div>'
      + '<div class="wz-body"></div>'
      + '<div class="wz-foot">'
      + '<button class="luma-btn wz-back" type="button">Back</button>'
      + '<button class="luma-btn primary wz-next" type="button">Next</button>'
      + '</div></div>';
    this.overlay.querySelector('.wz-x').addEventListener('click', () => this.close());
    this.overlay.querySelector('.wz-back').addEventListener('click', () => this._onBack());
    this.overlay.querySelector('.wz-next').addEventListener('click', () => this._onNext());
    this.overlay.addEventListener('click', (e) => { if (e.target === this.overlay) this.close(); });
    document.body.appendChild(this.overlay);
  }

  injectButton() {
    const sub = document.querySelector('#setupRoot .page-sub');
    if (!sub || sub.querySelector('.wz-launch')) return;
    const button = Dom.el('button', 'wz-launch', '✨ Easy Setup');
    button.type = 'button';
    button.title = 'Guided setup: pick & download a local model for your hardware';
    button.addEventListener('click', () => this.open());
    sub.appendChild(button);
  }

  _watchForReinject() {
    this.injectButton();
    const root = document.getElementById('setupRoot');
    if (!root || !window.MutationObserver) return;
    this._observer = new MutationObserver(() => this.injectButton());
    this._observer.observe(root, { childList: true, subtree: true });
  }
}
