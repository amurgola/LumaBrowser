import HtmlEscaper from '../../../../llm-server/ui/js/format/HtmlEscaper.js';
import SetupQuestions from '../../../../llm-server/ui/js/setup/SetupQuestions.js';
import SpeedSimulator from '../../../../llm-server/ui/js/setup/SpeedSimulator.js';

export default class LlmQuestionsPane {
  constructor(wizard, step) {
    this._w = wizard;
    this._step = step;
  }

  render(pane) {
    const a = this._w.state.llm.local.answers;
    const Q = SetupQuestions.QUESTIONS;
    pane.innerHTML = `
        <div class="setup-wizard__callout">
          Everything runs locally. Your conversations never leave this device.
          Setup is one model download (a few GB) and a couple of minutes.
        </div>
        ${LlmQuestionsPane._groupHtml('useCase', Q.useCase, a)}
        ${a.useCase ? LlmQuestionsPane._speedHtml(Q.tkPref, a) : ''}
        ${(a.useCase && a.tkPref) ? LlmQuestionsPane._groupHtml('ctxPref', Q.ctxPref, a) : ''}
        ${(a.useCase && a.tkPref && a.ctxPref) ? `
        <div style="display:flex; gap:10px; margin-top:6px;">
          <button class="setup-wizard__btn setup-wizard__btn--primary" id="llmRecBtn" type="button">See recommendation</button>
        </div>` : ''}
      `;
    this._wire(pane);
  }

  static _groupHtml(key, q, answers) {
    const esc = HtmlEscaper.escape;
    const cards = q.options.map((o) => `
          <button class="setup-wizard__card${answers[key] === o.value ? ' setup-wizard__card--selected' : ''}"
                  type="button" data-q="${key}" data-v="${esc(String(o.value))}">
            <div class="setup-wizard__card-title">${esc(o.title)}</div>
            <div class="setup-wizard__card-desc">${esc(o.desc)}</div>
          </button>`).join('');
    return `
          <div class="setup-wizard__subhead">${esc(q.label)}</div>
          <div class="setup-wizard__card-grid">${cards}</div>`;
  }

  static _speedHtml(q, answers) {
    const esc = HtmlEscaper.escape;
    const cols = q.options.map((o) => `
        <div class="setup-wizard__speed${answers.tkPref === o.value ? ' setup-wizard__speed--sel' : ''}">
          <div class="setup-wizard__speed-head">${esc(o.title)} · ${esc(o.desc)}</div>
          <div class="setup-wizard__speed-text" data-speed-text="${o.value}"></div>
          <button class="setup-wizard__speed-pick" type="button" data-speed-pick="${o.value}">${answers.tkPref === o.value ? 'Selected' : 'This is my limit'}</button>
        </div>`).join('');
    return `
        <div class="setup-wizard__subhead">${esc(q.label)}</div>
        <div class="setup-wizard__speed-help">Each pane types in real time at that speed. Pick the slowest you'd still be comfortable waiting on. Faster picks favor speed, slower picks unlock more capable models.</div>
        <div class="setup-wizard__speed-row">${cols}</div>`;
  }

  _wire(pane) {
    const L = this._w.state.llm.local;
    pane.querySelectorAll('[data-q]').forEach((el) => {
      el.addEventListener('click', () => {
        L.answers[el.getAttribute('data-q')] = el.getAttribute('data-v');
        this._step.render();
      });
    });
    pane.querySelectorAll('[data-speed-text]').forEach((out) => {
      this._w.addSpeedTimer(SpeedSimulator.start(out, Number(out.getAttribute('data-speed-text'))));
    });
    pane.querySelectorAll('[data-speed-pick]').forEach((btn) => {
      btn.addEventListener('click', () => {
        L.answers.tkPref = Number(btn.getAttribute('data-speed-pick'));
        this._step.render();
      });
    });
    const recBtn = pane.querySelector('#llmRecBtn');
    if (recBtn) {
      recBtn.addEventListener('click', () => {
        L.view = 'recommend';
        L.rec = null;
        this._step.render();
      });
    }
  }
}
