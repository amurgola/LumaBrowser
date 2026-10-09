import HtmlEscaper from '../../../../llm-server/ui/js/format/HtmlEscaper.js';
import Clipboard from '../../../../llm-server/ui/js/dom/Clipboard.js';
import PlanText from '../PlanText.js';
import ProgressPane from '../ProgressPane.js';
import WizardApis from '../WizardApis.js';

export default class AutoStatusPanes {
  constructor(wizard, step) {
    this._w = wizard;
    this._step = step;
  }

  progress(pane) {
    ProgressPane.render(pane, 'auto', () => {
      this._w.state.auto.canceled = true;
      WizardApis.cancelDownload('llmServer');
      WizardApis.cancelDownload('imageServer');
    });
  }

  done(pane) {
    const A = this._w.state.auto;
    pane.innerHTML = `
        <div class="setup-wizard__rec">
          <div class="setup-wizard__rec-head">Local AI ready</div>
          <div class="setup-wizard__rec-name">${HtmlEscaper.escape(A.modelName || 'Your local model')}</div>
          <p class="setup-wizard__rec-why">
            Downloaded and running. Click <strong>Continue</strong>, then
            <strong>Finish Setup</strong>, and you will land right in the chat.
          </p>
          ${AutoStatusPanes._imageLine(A)}
        </div>
      `;
  }

  static _imageLine(A) {
    if (!A.plan || !A.plan.image) {
      return `<p class="setup-wizard__rec-why">Images: not installed. Add them later from the Image tab, or when you first ask for one in chat.</p>`;
    }
    if (A.imageDone) return `<p class="setup-wizard__rec-why">Images: ready.</p>`;
    return `<div class="setup-wizard__status setup-wizard__status--info" style="margin-top:10px;">
               Images: failed (${HtmlEscaper.escape(A.imageError || 'unknown error')}). Chat works; retry from the Image tab.
             </div>`;
  }

  error(pane) {
    const A = this._w.state.auto;
    const sys = A.sysdeps;
    const hint = sys ? '' : PlanText.failureHint(A.error, A.failedStep);
    const canDropImages = !!(A.plan && A.plan.image);
    pane.innerHTML = `
        <div class="setup-wizard__status setup-wizard__status--err" style="margin-bottom:${hint ? '6px' : '14px'};">${HtmlEscaper.escape(A.error || 'Automatic setup failed.')}</div>
        ${hint ? `<p class="setup-wizard__step-desc" style="margin-bottom:14px;">${HtmlEscaper.escape(hint)}</p>` : ''}
        ${AutoStatusPanes._sysdepsHtml(sys)}
        <div style="display:flex; gap:10px; margin-top:${sys ? '14px' : '0'}; flex-wrap:wrap;">
          <button class="setup-wizard__btn setup-wizard__btn--primary" id="autoRetry" type="button">${sys ? 'Check again' : 'Fix and retry'}</button>
          <button class="setup-wizard__btn setup-wizard__btn--secondary" id="autoSmaller" type="button">Choose a smaller setup</button>
          ${canDropImages ? `<button class="setup-wizard__btn setup-wizard__btn--secondary" id="autoNoImages" type="button">Chat without images</button>` : ''}
        </div>
      `;
    this._wireError(pane, sys);
  }

  static _sysdepsHtml(sys) {
    if (!sys) return '';
    const esc = HtmlEscaper.escape;
    const unmapped = (sys.missing || []).filter((m) => !m.pkg).map((m) => m.soname);
    return `
        ${sys.aptLine ? `<div class="setup-wizard__cmd"><code id="autoAptLine">${esc(sys.aptLine)}</code>
          <button class="setup-wizard__btn setup-wizard__btn--secondary" id="autoAptCopy" type="button">Copy</button></div>` : ''}
        ${unmapped.length ? `<div class="setup-wizard__help">Also needed but not in a known package: ${esc(unmapped.join(', '))}</div>` : ''}`;
  }

  _wireError(pane, sys) {
    const copyBtn = pane.querySelector('#autoAptCopy');
    if (copyBtn) copyBtn.addEventListener('click', () => AutoStatusPanes._copy(copyBtn, sys.aptLine || ''));
    pane.querySelector('#autoRetry').addEventListener('click', () => this._retry());
    pane.querySelector('#autoSmaller').addEventListener('click', () => this._smaller());
    const noImg = pane.querySelector('#autoNoImages');
    if (noImg) noImg.addEventListener('click', () => this._withoutImages());
  }

  static async _copy(btn, text) {
    if (!(await Clipboard.copyText(text))) return;
    btn.textContent = 'Copied';
    setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
  }

  _retry() {
    const A = this._w.state.auto;
    const failed = A.failedStep;
    AutoStatusPanes._clearFailure(A);
    this._step.runner.run({ resumeFrom: (failed === 'image' || failed === 'music') ? failed : null });
  }

  _smaller() {
    const s = this._w.state;
    s.flow = 'guided';
    if (!s.workflow || s.workflow === 'chat' || s.workflow === 'create') this._w.applyWorkflow(s.persona === 'create' ? 'create' : 'chat');
    s.llm.mode = 'local';
    s.llm.local.view = 'questions';
    s.llm.local.rec = null;
    this._w.jumpTo('llm');
  }

  _withoutImages() {
    const A = this._w.state.auto;
    A.wantImage = false;
    A.wantMusic = false;
    if (A.plan) { A.plan.image = null; A.plan.music = null; }
    AutoStatusPanes._clearFailure(A);
    this._step.runner.run();
  }

  static _clearFailure(A) {
    A.error = null;
    A.canceled = false;
    A.sysdeps = null;
    A.failedStep = null;
  }
}
