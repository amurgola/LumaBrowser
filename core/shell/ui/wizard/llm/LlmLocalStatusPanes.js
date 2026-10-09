import HtmlEscaper from '../../../../llm-server/ui/js/format/HtmlEscaper.js';
import ProgressPane from '../ProgressPane.js';
import WizardApis from '../WizardApis.js';
import WizardState from '../WizardState.js';

export default class LlmLocalStatusPanes {
  constructor(wizard, step) {
    this._w = wizard;
    this._step = step;
  }

  progress(pane) {
    ProgressPane.render(pane, 'llm', () => {
      this._w.state.llm.local.canceled = true;
      WizardApis.cancelDownload('llmServer');
    });
  }

  done(pane) {
    const L = this._w.state.llm.local;
    const adopted = this._w.state.persona === 'switch' && !!L.existing;
    pane.innerHTML = `
        <div class="setup-wizard__rec">
          <div class="setup-wizard__rec-head">Local AI ready</div>
          <div class="setup-wizard__rec-name">${HtmlEscaper.escape(L.modelName || 'Your local model')}</div>
          <p class="setup-wizard__rec-why">
            ${adopted ? 'Linked and running.' : 'Downloaded and running.'} The <strong>LLM</strong> tab is now available with a
            built-in chat, and AI-powered features are wired to it.
            Click <strong>Continue</strong> to finish setup.
          </p>
        </div>
      `;
  }

  error(pane) {
    pane.innerHTML = `
        <div class="setup-wizard__status setup-wizard__status--err" style="margin-bottom:14px;">${HtmlEscaper.escape(this._w.state.llm.local.error || 'Setup failed.')}</div>
        <div style="display:flex; gap:10px;">
          <button class="setup-wizard__btn setup-wizard__btn--primary" id="llmRetry" type="button">Try again</button>
          <button class="setup-wizard__btn setup-wizard__btn--secondary" id="llmToRemote" type="button">Use a hosted API instead</button>
        </div>
      `;
    pane.querySelector('#llmRetry').addEventListener('click', () => this._retry());
    pane.querySelector('#llmToRemote').addEventListener('click', () => this._toRemote());
  }

  _retry() {
    const L = this._w.state.llm.local;
    L.view = (this._w.state.persona === 'switch' && L.existing && !L.rec) ? 'existing' : (L.rec ? 'recommend' : 'questions');
    L.error = null;
    this._step.render();
  }

  _toRemote() {
    const llm = this._w.state.llm;
    llm.mode = 'remote';
    llm.type = 'anthropic';
    llm.endpoint = WizardState.ANTHROPIC_ENDPOINT;
    this._step.render();
    this._w.renderFooter();
  }
}
