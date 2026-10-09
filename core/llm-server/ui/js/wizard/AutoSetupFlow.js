import HtmlEscaper from '../format/HtmlEscaper.js';
import AutoSetup from '../setup/AutoSetup.js';
import AutoPlanView from './AutoPlanView.js';
import AutoQuestionViews from './AutoQuestionViews.js';
import AutoResultViews from './AutoResultViews.js';
import PausedView from './PausedView.js';
import ProgressBar from './ProgressBar.js';

export default class AutoSetupFlow {
  static STAGES = ['Automatic setup', 'Your plan', 'Installing'];

  constructor(wizard) {
    this._wizard = wizard;
  }

  static stageIndex(view) {
    if (view === 'plan') return 1;
    if (view === 'progress' || view === 'done' || view === 'error') return 2;
    return 0;
  }

  render() {
    const w = this._wizard;
    const A = w.state.auto;
    this._paintStages(AutoSetupFlow.stageIndex(A.view));
    const body = w.body();
    w.timers.clear();
    body.innerHTML = '';
    this._paintFoot(A);
    if (A.view === 'question-music') return AutoQuestionViews.music(w, body);
    if (A.view === 'plan') return AutoPlanView.render(w, body);
    if (A.view === 'progress') return AutoResultViews.progress(w, body);
    if (A.view === 'done') return AutoResultViews.done(w, body);
    if (A.view === 'error') return AutoResultViews.error(w, body);
    return AutoQuestionViews.image(w, body);
  }

  _paintStages(stage) {
    const dots = AutoSetupFlow.STAGES.map((t, i) => `<span class="wz-dot${i === stage ? ' on' : ''}${i < stage ? ' done' : ''}"></span>`).join('');
    this._wizard.overlay.querySelector('.wz-steps').innerHTML = dots
      + '<span class="wz-step-name">' + HtmlEscaper.escape(AutoSetupFlow.STAGES[stage]) + '</span>';
  }

  _paintFoot(A) {
    const w = this._wizard;
    const back = w.overlay.querySelector('.wz-back');
    w.overlay.querySelector('.wz-next').hidden = true;
    back.style.visibility = (A.view === 'question' || A.view === 'plan') && !A.busy ? 'visible' : 'hidden';
    back.onclick = null;
    back.disabled = false;
    if (A.view === 'question') {
      back.onclick = () => { w.state.mode = null; w.render(); };
    } else if (A.view === 'question-music') {
      back.style.visibility = A.busy ? 'hidden' : 'visible';
      back.onclick = () => { A.view = 'question'; w.render(); };
    } else if (A.view === 'plan') {
      back.onclick = () => { A.view = w.musicOffered() ? 'question-music' : 'question'; w.render(); };
    }
  }

  async run() {
    const w = this._wizard;
    const A = w.state.auto;
    if (!A.plan) return;
    Object.assign(A, { busy: true, canceled: false, view: 'progress' });
    w.setCloseDisabled(true);
    w.render();
    const result = await AutoSetup.run(this._apis(), { plan: A.plan, isCanceled: () => A.canceled, ...this._hooks(w.body()) });
    A.busy = false;
    w.setCloseDisabled(false);
    if (result.paused) { PausedView.show(w, w.body(), () => this.run()); return; }
    if (!result.ok) { this._failed(A, result); return; }
    await this._done(A, result);
  }

  _apis() {
    const w = this._wizard;
    const root = w.root();
    return { llm: w.api(), image: w.imageApi(), music: root && root.music, placement: root && root.placement, system: w.api() };
  }

  _hooks(body) {
    const q = (s) => body.querySelector(s);
    return {
      onPhase: (t) => { const e = q('[data-auto-phase]'); if (e) e.textContent = t; },
      onBar: (fraction, sub) => {
        ProgressBar.set(q('[data-auto-bar]'), q('[data-auto-fill]'), fraction);
        if (sub != null) { const s = q('[data-auto-sub]'); if (s) s.textContent = sub; }
      },
      onSub: (t) => { const s = q('[data-auto-sub]'); if (s) s.textContent = t; },
    };
  }

  _failed(A, result) {
    A.sysdeps = result.sysdeps || null;
    A.error = result.canceled
      ? 'Setup canceled. Your download progress is saved; run Easy Setup again to resume.'
      : (result.message || 'Automatic setup failed');
    A.view = 'error';
    this._wizard.render();
  }

  async _done(A, result) {
    const w = this._wizard;
    A.sysdeps = null;
    try { await w.api().setUiMode('chat'); } catch (_) {}
    A.modelName = (result.file || '').replace(/\.[^.]+$/, '') || 'local-model';
    A.imageDone = !!(result.image && result.image.ok);
    A.imageError = result.image && !result.image.ok ? (result.image.message || null) : null;
    A.musicDone = !!(result.music && result.music.ok);
    A.musicError = result.music && !result.music.ok ? (result.music.message || null) : null;
    A.view = 'done';
    w.render();
  }
}
