import HtmlEscaper from '../../../llm-server/ui/js/format/HtmlEscaper.js';
import AutoStep from './steps/AutoStep.js';
import DoneStep from './steps/DoneStep.js';
import FeaturesStep from './steps/FeaturesStep.js';
import ImageStep from './steps/ImageStep.js';
import LlmStep from './steps/LlmStep.js';
import PersonaStep from './steps/PersonaStep.js';
import WebhookStep from './steps/WebhookStep.js';
import WorkflowStep from './steps/WorkflowStep.js';
import ModalGuard from './ModalGuard.js';
import WizardApis from './WizardApis.js';
import WizardFinisher from './WizardFinisher.js';
import WizardPersonas from './WizardPersonas.js';
import WizardState from './WizardState.js';
import WizardSteps from './WizardSteps.js';
import WorkflowPresets from './WorkflowPresets.js';

export default class SetupWizard {
  constructor({ modalEl, onComplete }) {
    this.modalEl = modalEl;
    this.onComplete = onComplete || (() => {});
    this.bodyEl = modalEl.querySelector('#setupWizardBody');
    this.stepsEl = modalEl.querySelector('#setupWizardSteps');
    this.progressEl = modalEl.querySelector('#setupWizardProgress');
    this.backBtn = modalEl.querySelector('#setupWizardBackBtn');
    this.nextBtn = modalEl.querySelector('#setupWizardNextBtn');
    this.skipBtn = modalEl.querySelector('#setupWizardSkipBtn');
    this.extensions = [];
    this.state = WizardState.initial();
    this.extensionsReady = Promise.resolve();
    this._speedTimers = [];
    this._currentIdx = 0;
    this._steps = [];
    this._skipArmed = false;
    this._guard = new ModalGuard(modalEl);
    this._finisher = new WizardFinisher(this);
    this._views = this._createViews();
  }

  async start() {
    this._log('start() called');
    this.extensionsReady = this._loadExtensions();
    this.applyPersona(WizardPersonas.DEFAULT, { silent: true });
    this.rebuildSteps();
    this._currentIdx = 0;
    this._show();
    this.render();
    this._log('initial _render() complete');
    this.extensionsReady.then(() => {
      this._log('extensions lookup resolved');
      this.rebuildSteps();
      this.renderSidebar();
      this.renderFooter();
    });
    if (!this.state.llm.endpoint) this.state.llm.endpoint = WizardState.endpointFor(this.state.llm.type);
  }

  step(id) {
    return this._views[id] || null;
  }

  currentStepId() {
    const step = this._steps[this._currentIdx];
    return step ? step.id : null;
  }

  steps() {
    return this._steps.slice();
  }

  applyPersona(id, { silent = false } = {}) {
    const persona = WizardPersonas.normalize(id);
    this.state.persona = persona;
    this._resetAutoOutcome();
    this._applyPersonaPath(persona);
    this.rebuildSteps();
    if (!silent && window.electronAPI && window.electronAPI.setPersona) {
      window.electronAPI.setPersona(persona).catch(() => {});
    }
  }

  applyWorkflow(presetId) {
    this.state.workflow = presetId;
    WorkflowPresets.applyTo(this.state.extensionOverrides, presetId);
  }

  enabledExtensions() {
    if (this.extensions.length > 0) {
      return this.extensions.filter((ext) => this.state.extensionOverrides.get(ext.id)).map((ext) => ext.id);
    }
    return [...this.state.extensionOverrides].filter(([, enabled]) => enabled).map(([id]) => id);
  }

  isPlainCopy() {
    return WizardPersonas.isPlain(this.state.persona);
  }

  musicOffered() {
    return !/mac/i.test(navigator.platform || '');
  }

  isCurrentStepValid() {
    const id = this.currentStepId();
    return !!id && WizardSteps.isValid(id, this.state, this.enabledExtensions().length);
  }

  rebuildSteps() {
    const prevId = this.currentStepId();
    this._steps = WizardSteps.build(this.state, this.enabledExtensions());
    if (!prevId) return;
    const newIdx = this._steps.findIndex((s) => s.id === prevId);
    if (newIdx >= 0) this._currentIdx = newIdx;
  }

  jumpTo(stepId) {
    this.rebuildSteps();
    const idx = this._steps.findIndex((s) => s.id === stepId);
    if (idx >= 0) this._currentIdx = idx;
    this.render();
  }

  render() {
    this._skipArmed = false;
    this.clearSpeedTimers();
    this.renderSidebar();
    const view = this._views[this.currentStepId()];
    if (view) view.enter();
    this.renderFooter();
  }

  renderSidebar() {
    this.stepsEl.innerHTML = this._steps.map((step, idx) => SetupWizard._sidebarItem(step, idx, this._currentIdx)).join('');
  }

  renderFooter() {
    const id = this.currentStepId();
    this.progressEl.textContent = `Step ${this._currentIdx + 1} of ${this._steps.length}`;
    const busy = this._installBusy(id);
    this.backBtn.disabled = this._currentIdx === 0 || busy;
    this.backBtn.hidden = id === 'persona';
    this.nextBtn.textContent = id === 'done' ? 'Finish Setup' : (id === 'persona' ? 'Get Started' : 'Continue');
    this.skipBtn.hidden = !(id && id !== 'done' && !busy);
    this.skipBtn.textContent = 'Skip setup';
    this.nextBtn.disabled = !this.isCurrentStepValid();
  }

  goBack() {
    if (this._currentIdx === 0) return;
    this._skipArmed = false;
    this._currentIdx--;
    this.render();
  }

  goNext() {
    const id = this.currentStepId();
    if (!id) return;
    if (id === 'done') { this.finish(); return; }
    if (!this.isCurrentStepValid()) return;
    this._skipArmed = false;
    this.rebuildSteps();
    this._currentIdx = Math.min(this._currentIdx + 1, this._steps.length - 1);
    this.render();
  }

  skip() {
    if (!this.currentStepId() || this._skipArmed) return;
    this._skipArmed = true;
    Promise.resolve(SetupWizard._confirmSkip()).then((ok) => {
      this._skipArmed = false;
      if (ok) this.finish();
    }).catch(() => { this._skipArmed = false; });
  }

  finish() {
    return this._finisher.finish();
  }

  addSpeedTimer(timer) {
    this._speedTimers.push(timer);
  }

  clearSpeedTimers() {
    while (this._speedTimers.length) {
      try { clearInterval(this._speedTimers.pop()); } catch (_) {}
    }
  }

  teardown() {
    this.clearSpeedTimers();
    this._guard.detach();
    const auto = this.state.auto || {};
    if ((this.state.llm.local && this.state.llm.local.busy) || auto.busy) WizardApis.cancelDownload('llmServer');
    if ((this.state.image && this.state.image.busy) || auto.busy) WizardApis.cancelDownload('imageServer');
    this.modalEl.classList.remove('active');
    try { this.onComplete(); } catch (err) { console.error('SetupWizard onComplete threw:', err); }
  }

  _createViews() {
    return {
      persona: new PersonaStep(this),
      auto: new AutoStep(this),
      workflow: new WorkflowStep(this),
      features: new FeaturesStep(this),
      llm: new LlmStep(this),
      image: new ImageStep(this),
      webhook: new WebhookStep(this),
      done: new DoneStep(this),
    };
  }

  async _loadExtensions() {
    if (!window.ipcBridge || !window.ipcBridge.getExtensions) return;
    try {
      const list = await window.ipcBridge.getExtensions();
      this.extensions = Array.isArray(list) ? list : [];
      for (const ext of this.extensions) {
        if (!this.state.extensionOverrides.has(ext.id)) this.state.extensionOverrides.set(ext.id, ext.enabled !== false);
      }
    } catch (_) {
      this.extensions = [];
    }
  }

  _show() {
    this.modalEl.classList.add('active');
    this._log('.active class added to modal');
    requestAnimationFrame(() => requestAnimationFrame(() => this._log('two rAFs after .active (first paint)')));
    this._guard.attach();
    this.backBtn.addEventListener('click', () => this.goBack());
    this.nextBtn.addEventListener('click', () => this.goNext());
    this.skipBtn.addEventListener('click', () => this.skip());
  }

  _resetAutoOutcome() {
    const A = this.state.auto;
    A.plan = null;
    A.error = null;
    A.failedStep = null;
    A.sysdeps = null;
  }

  _applyPersonaPath(persona) {
    const A = this.state.auto;
    if (persona === 'chat') {
      Object.assign(A, { wantImage: false, wantMusic: false, view: 'plan' });
      this._setPath('auto', 'chat');
    } else if (persona === 'create') {
      Object.assign(A, { wantImage: true, wantMusic: null, view: this.musicOffered() ? 'question-music' : 'plan' });
      this._setPath('auto', 'create');
    } else if (persona === 'build') {
      this._setPath('guided', 'agent-toolkit');
    } else {
      this._setPath('guided', 'custom');
      if (persona === 'switch') this._openLibraryScan();
    }
  }

  _setPath(flow, presetId) {
    this.state.flow = flow;
    this.applyWorkflow(presetId);
  }

  _openLibraryScan() {
    const L = this.state.llm.local;
    this.state.llm.mode = 'local';
    Object.assign(L, { view: 'existing', existing: null, importRec: null, error: null });
  }

  _installBusy(id) {
    const s = this.state;
    if (id === 'llm') return s.llm.mode === 'local' && s.llm.local.busy;
    if (id === 'image') return s.image.busy;
    if (id === 'auto') return s.auto.busy;
    return false;
  }

  static _sidebarItem(step, idx, currentIdx) {
    const cls = idx === currentIdx ? 'setup-wizard__step setup-wizard__step--current'
      : idx < currentIdx ? 'setup-wizard__step setup-wizard__step--done'
        : 'setup-wizard__step';
    return `
          <div class="${cls}">
            <span class="setup-wizard__step-number">${idx + 1}</span>
            <span class="setup-wizard__step-label">${HtmlEscaper.escape(step.label)}</span>
          </div>
        `;
  }

  static _confirmSkip() {
    const modal = window.LumaModal;
    if (!modal || typeof modal.confirm !== 'function') return Promise.resolve(true);
    return modal.confirm('You can run setup later from the LLM tab.', { title: 'Skip setup?', okLabel: 'Skip setup', cancelLabel: 'Keep going' });
  }

  _log(label) {
    const start = window.__LUMA_BOOT_START || Date.now();
    console.log(`[luma-boot +${Date.now() - start}ms] wizard: ${label}`);
  }
}
