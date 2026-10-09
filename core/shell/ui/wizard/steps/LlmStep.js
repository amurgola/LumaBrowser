import HtmlEscaper from '../../../../llm-server/ui/js/format/HtmlEscaper.js';
import LlmExistingPane from '../llm/LlmExistingPane.js';
import LlmLocalRunner from '../llm/LlmLocalRunner.js';
import LlmLocalStatusPanes from '../llm/LlmLocalStatusPanes.js';
import LlmQuestionsPane from '../llm/LlmQuestionsPane.js';
import LlmRecommendPane from '../llm/LlmRecommendPane.js';
import LlmRemotePane from '../llm/LlmRemotePane.js';
import WizardState from '../WizardState.js';
import WizardStepView from './WizardStepView.js';

export default class LlmStep extends WizardStepView {
  static CARDS = [
    {
      mode: 'local', type: null,
      title: 'Local AI', badge: 'On-device',
      desc: 'Runs entirely on this machine: private, no API key, no usage fees. We pick a model that fits your hardware and download it for you.',
    },
    {
      mode: 'remote', type: 'anthropic',
      title: 'Anthropic Claude', badge: 'API key',
      desc: 'Use your Anthropic API key. Highest quality, billed by Anthropic.',
    },
    {
      mode: 'remote', type: 'openai',
      title: 'OpenAI-Compatible', badge: 'API key',
      desc: 'OpenAI, LM Studio, Ollama, or any OpenAI-compatible endpoint.',
    },
  ];

  constructor(wizard) {
    super(wizard);
    this._configLoaded = false;
    this.runner = new LlmLocalRunner(wizard, this);
    this._remote = new LlmRemotePane(wizard, this);
    this._existing = new LlmExistingPane(wizard, this);
    this._questions = new LlmQuestionsPane(wizard, this);
    this._recommend = new LlmRecommendPane(wizard, this);
    this._status = new LlmLocalStatusPanes(wizard, this);
  }

  enter() {
    if (!this._state.llm.apiKey) {
      this._loadSavedConfig().then(() => {
        const llm = this._state.llm;
        if (!this._isCurrent('llm') || llm.local.busy) return;
        if (llm.mode === 'local' && llm.local.view !== 'questions') return;
        this.render();
      });
    }
    this.render();
  }

  render() {
    this._w.clearSpeedTimers();
    const llm = this._state.llm;
    const local = llm.local;
    const hideCards = llm.mode === 'local'
      && (local.busy || local.view === 'progress' || local.view === 'done' || local.view === 'error');
    this._body.innerHTML = `
        <div class="setup-wizard__panel">
          <div class="setup-wizard__step-eyebrow">AI Provider</div>
          <h2 class="setup-wizard__step-title">Connect your LLM</h2>
          <p class="setup-wizard__step-desc">
            ${this._state.persona === 'switch'
    ? 'Point LumaBrowser at a model you already have, download one, or bring your own API key.'
    : `Some of the features you picked (<em>ai-chat</em>, <em>selenium-driver</em>)
            need a language model. Run one locally, or bring your own API key.`}
          </p>
          ${hideCards ? '' : `<div class="setup-wizard__card-grid" id="setupLlmModeGrid">${this._cardsHtml()}</div>`}
          <div id="setupLlmPane"></div>
        </div>
      `;
    if (!hideCards) this._wireCards();
    this._renderPane(this.pane());
  }

  pane() {
    return this._body.querySelector('#setupLlmPane');
  }

  _renderPane(pane) {
    const llm = this._state.llm;
    if (llm.mode === 'remote') { this._remote.render(pane); return; }
    if (llm.mode !== 'local') return;
    const v = llm.local.view;
    if (v === 'existing') this._existing.render(pane);
    else if (v === 'recommend') this._recommend.render(pane);
    else if (v === 'progress') this._status.progress(pane);
    else if (v === 'done') this._status.done(pane);
    else if (v === 'error') this._status.error(pane);
    else this._questions.render(pane);
  }

  _cardsHtml() {
    const esc = HtmlEscaper.escape;
    const llm = this._state.llm;
    const isSel = (c) => (c.mode === 'local' ? llm.mode === 'local' : (llm.mode === 'remote' && llm.type === c.type));
    return LlmStep.CARDS.map((c) => `
        <button class="setup-wizard__card${isSel(c) ? ' setup-wizard__card--selected' : ''}"
                type="button" data-llm-mode="${c.mode}" data-llm-type="${c.type || ''}">
          <div class="setup-wizard__card-title">
            ${esc(c.title)}
            <span class="setup-wizard__card-badge">${esc(c.badge)}</span>
          </div>
          <div class="setup-wizard__card-desc">${esc(c.desc)}</div>
        </button>
      `).join('');
  }

  _wireCards() {
    this._body.querySelectorAll('[data-llm-mode]').forEach((el) => {
      el.addEventListener('click', () => {
        this._pick(el.getAttribute('data-llm-mode'), el.getAttribute('data-llm-type'));
        this.render();
        this._w.renderFooter();
      });
    });
  }

  _pick(mode, type) {
    const llm = this._state.llm;
    if (mode === 'local') { llm.mode = 'local'; return; }
    const changed = llm.type !== type;
    llm.mode = 'remote';
    llm.type = type;
    if (!changed) return;
    llm.endpoint = WizardState.endpointFor(type);
    llm.models = [];
    llm.selectedModel = '';
  }

  async _loadSavedConfig() {
    if (this._configLoaded) return;
    this._configLoaded = true;
    if (!window.ipcBridge || !window.ipcBridge.getProviderConfigs) return;
    try {
      const configs = await window.ipcBridge.getProviderConfigs();
      if (!Array.isArray(configs) || configs.length === 0) return;
      const remote = configs.filter((c) => c && !c.managedByCore);
      const first = remote.find((c) => c.endpoint && c.apiKey) || remote[0];
      if (first) LlmStep._prefill(this._state.llm, first);
    } catch (_) {}
  }

  static _prefill(llm, saved) {
    llm.type = saved.type || 'anthropic';
    llm.endpoint = saved.endpoint || llm.endpoint;
    llm.apiKey = saved.apiKey || '';
    llm.selectedModel = saved.selectedModel || '';
    llm.models = Array.isArray(saved.models) ? saved.models : [];
    if (saved.apiKey) llm.mode = 'remote';
  }
}
