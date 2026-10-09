import HtmlEscaper from '../format/HtmlEscaper.js';
import LlmSetup from '../setup/LlmSetup.js';
import PausedView from './PausedView.js';
import ProgressBar from './ProgressBar.js';

export default class LlmSetupFlow {
  static PROGRESS_HTML = '<div class="wz-prog">'
    + '<div class="wz-prog-phase">Preparing…</div>'
    + '<div class="luma-progress wz-bar"><div class="luma-progress-fill wz-bar-fill"></div></div>'
    + '<div class="wz-prog-sub"></div>'
    + '<div class="wz-prog-actions">'
    + '<button class="luma-btn wz-pause" type="button">Pause</button>'
    + '<button class="luma-btn wz-cancel" type="button">Cancel</button>'
    + '</div>'
    + '</div>';

  constructor(wizard) {
    this._wizard = wizard;
  }

  async run(body) {
    const w = this._wizard;
    const advanced = body.querySelector('.wz-adv-in');
    if (advanced) w.state.advanced = advanced.value.trim() || '';
    w.state.busy = true;
    w.overlay.querySelector('.wz-back').disabled = true;
    w.setCloseDisabled(true);
    body.innerHTML = LlmSetupFlow.PROGRESS_HTML;
    const hooks = this._wireProgress(body);
    const result = await LlmSetup.run(w.api(), {
      rec: w.state.rec,
      override: w.state.override,
      advanced: w.state.advanced,
      isCanceled: () => this._canceled,
      ...hooks,
    });
    if (result.paused) { PausedView.show(w, body, () => this.run(body)); return; }
    if (!result.ok) {
      this._fail(body, result.canceled
        ? 'Setup canceled. Your progress is saved: run Easy Setup again to resume.'
        : (result.message || 'Setup failed'));
      return;
    }
    await this._done(body);
  }

  _wireProgress(body) {
    const phase = body.querySelector('.wz-prog-phase');
    const bar = body.querySelector('.wz-bar');
    const fill = body.querySelector('.wz-bar-fill');
    const sub = body.querySelector('.wz-prog-sub');
    const cancel = body.querySelector('.wz-cancel');
    const pause = body.querySelector('.wz-pause');
    this._canceled = false;
    cancel.addEventListener('click', () => {
      this._canceled = true;
      try { this._wizard.api().cancelModelDownload(); } catch (_) {}
      cancel.disabled = true;
      cancel.textContent = 'Canceling…';
      if (pause) pause.disabled = true;
    });
    pause.addEventListener('click', () => {
      pause.disabled = true;
      pause.textContent = 'Pausing…';
      try { this._wizard.api().pauseModelDownload(); } catch (_) {}
    });
    return {
      onPhase: (t) => { phase.textContent = t; },
      onBar: (fraction, s) => { ProgressBar.set(bar, fill, fraction); if (s != null) sub.textContent = s; },
      onSub: (t) => { sub.textContent = t; },
    };
  }

  _fail(body, message) {
    body.innerHTML = '<div class="luma-callout bad">' + HtmlEscaper.escape(message) + '</div>'
      + '<button class="luma-btn primary luma-btn--block wz-go" type="button">Back to recommendation</button>';
    body.querySelector('.wz-go').addEventListener('click', () => {
      this._wizard.state.busy = false;
      this._wizard.setCloseDisabled(false);
      this._wizard.render();
    });
  }

  async _done(body) {
    const w = this._wizard;
    try { await w.api().setUiMode('chat'); } catch (_) {}
    w.state.llmDone = true;
    w.state.busy = false;
    w.setCloseDisabled(false);
    const label = w.state.override ? w.state.override.label : w.state.rec.label;
    body.innerHTML = '<div class="wz-done"><div class="wz-done-ic"></div>'
      + '<h2>Local AI is ready</h2>'
      + '<p>' + HtmlEscaper.escape(label) + ' is downloaded and running. '
      + 'Want to add local image generation while you’re here?</p>'
      + '<div class="wz-img-actions">'
      + '<button class="luma-btn primary luma-btn--block wz-go" data-image-next type="button">Continue to image generation</button>'
      + '<button class="luma-btn link wz-back-link" data-skip-image type="button">Skip · start chatting</button>'
      + '</div></div>';
    body.querySelector('[data-image-next]').addEventListener('click', () => { w.state.step = 5; w.render(); });
    body.querySelector('[data-skip-image]').addEventListener('click', () => w.goChat());
  }
}
