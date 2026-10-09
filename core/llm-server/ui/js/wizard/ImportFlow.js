import HtmlEscaper from '../format/HtmlEscaper.js';
import ImportSetup from '../setup/ImportSetup.js';

export default class ImportFlow {
  constructor(wizard) {
    this._wizard = wizard;
  }

  async run(found, rec) {
    const w = this._wizard;
    const body = w.body();
    w.state.busy = true;
    w.setCloseDisabled(true);
    body.innerHTML = ImportFlow._progressHtml();
    const phase = body.querySelector('.wz-prog-phase');
    const sub = body.querySelector('.wz-prog-sub');
    const result = await ImportSetup.run(w.api(), {
      found,
      runtimeId: rec && rec.runtimeId,
      contextSize: rec && rec.contextSize,
      kvCacheType: rec && rec.kvCacheType,
      onPhase: (t) => { phase.textContent = t; },
      onBar: (_fraction, s) => { if (s != null) sub.textContent = s; },
      onSub: (t) => { sub.textContent = t; },
    });
    w.state.busy = false;
    w.setCloseDisabled(false);
    if (!result.ok) { this._failed(body, result.message); return; }
    await this._done(body, found);
  }

  static _progressHtml() {
    return '<div class="wz-prog">'
      + '<div class="wz-prog-phase">Preparing…</div>'
      + '<div class="luma-progress wz-bar indeterminate"><div class="luma-progress-fill wz-bar-fill"></div></div>'
      + '<div class="wz-prog-sub"></div>'
      + '</div>';
  }

  _failed(body, message) {
    body.innerHTML = '<div class="luma-callout bad">' + HtmlEscaper.escape(message || 'Could not use that model.') + '</div>'
      + '<button class="luma-btn primary luma-btn--block wz-go" type="button">Back</button>';
    body.querySelector('.wz-go').addEventListener('click', () => this._wizard.render());
  }

  async _done(body, found) {
    const w = this._wizard;
    try { await w.api().setUiMode('chat'); } catch (_) {}
    w.state.llmDone = true;
    body.innerHTML = '<div class="wz-done"><div class="wz-done-ic"></div>'
      + '<h2>Local AI is ready</h2>'
      + '<p>' + HtmlEscaper.escape(found.name) + ' is set up and running. No download needed.</p>'
      + '<button class="luma-btn primary luma-btn--block wz-go" data-go-chat type="button">Start chatting</button></div>';
    body.querySelector('[data-go-chat]').addEventListener('click', () => w.goChat());
  }
}
