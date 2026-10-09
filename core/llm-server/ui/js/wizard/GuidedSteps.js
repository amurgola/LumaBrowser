import HtmlEscaper from '../format/HtmlEscaper.js';
import Dom from '../dom/Dom.js';
import SetupQuestions from '../setup/SetupQuestions.js';
import SpeedSimulator from '../setup/SpeedSimulator.js';
import ChoiceCard from './ChoiceCard.js';

export default class GuidedSteps {
  static SAMPLE_CHARS = { short: 28, medium: 90, long: 220 };

  static welcome(w, body) {
    body.appendChild(Dom.el('div', 'wz-hero',
      '<div class="wz-hero-mark">✨</div>'
      + '<h2>Let’s set up your local AI</h2>'
      + '<p>Everything runs locally. This takes one model download (a few GB) '
      + 'and a couple of minutes.</p>'));
    const grid = Dom.el('div', 'wz-cards');
    grid.appendChild(ChoiceCard.button('luma-choice wz-card',
      '<b>Automatic setup</b><span>We detect your hardware, pick the best '
      + 'model, and set everything up. One question, zero knobs.</span>',
      () => { w.state.mode = 'auto'; w.state.auto.view = 'question'; w.render(); }));
    grid.appendChild(ChoiceCard.button('luma-choice wz-card',
      '<b>Guided setup</b><span>Answer a few quick questions about use case, '
      + 'speed, and memory, then approve the pick (or browse HuggingFace).</span>',
      () => w.startGuided()));
    body.appendChild(grid);
  }

  static useCase(w, body) {
    const grid = Dom.el('div', 'wz-cards');
    for (const o of SetupQuestions.QUESTIONS.useCase.options) {
      grid.appendChild(ChoiceCard.button('luma-choice wz-card' + (w.state.answers.useCase === o.value ? ' sel' : ''),
        ChoiceCard.titleDesc(o.title, o.desc), () => { w.state.answers.useCase = o.value; w.render(); }));
    }
    body.appendChild(grid);
  }

  static speed(w, body) {
    body.appendChild(Dom.el('details', 'luma-callout wz-info',
      '<summary>More info</summary>'
      + 'Bigger, more capable models run slower on most machines. Pick the '
      + '<b>slowest</b> speed you could still comfortably work with.'));
    const row = Dom.el('div', 'wz-speed-row');
    for (const o of SetupQuestions.QUESTIONS.tkPref.options.slice().reverse()) row.appendChild(GuidedSteps._speedColumn(w, o));
    body.appendChild(row);
  }

  static context(w, body) {
    body.appendChild(Dom.el('details', 'luma-callout wz-info',
      '<summary>More info</summary>'
      + 'Context is how much of the conversation the model can “remember” at '
      + 'once. Longer context helps with big documents but uses more memory '
      + 'and can reduce accuracy.'));
    const grid = Dom.el('div', 'wz-cards');
    for (const o of SetupQuestions.QUESTIONS.ctxPref.options) {
      const sample = SpeedSimulator.LOREM.slice(0, GuidedSteps.SAMPLE_CHARS[o.value] || 90);
      grid.appendChild(ChoiceCard.button('luma-choice wz-card wz-ctx' + (w.state.answers.ctxPref === o.value ? ' sel' : ''),
        ChoiceCard.titleDesc(o.title, o.desc) + '<div class="wz-ctx-sample">' + HtmlEscaper.escape(sample) + '…</div>',
        () => { w.state.answers.ctxPref = o.value; w.render(); }));
    }
    body.appendChild(grid);
  }

  static _speedColumn(w, o) {
    const esc = HtmlEscaper.escape;
    const selected = w.state.answers.tkPref === o.value;
    const col = Dom.el('div', 'wz-speed' + (selected ? ' sel' : ''));
    col.innerHTML = '<div class="wz-speed-head">' + esc(o.title) + ' · ' + esc(o.desc) + '</div>'
      + '<div class="wz-speed-text"></div>'
      + '<button class="wz-speed-pick" type="button">' + (selected ? 'Selected' : 'This is my limit') + '</button>';
    w.timers.add(SpeedSimulator.start(col.querySelector('.wz-speed-text'), o.value));
    col.querySelector('.wz-speed-pick').addEventListener('click', () => { w.state.answers.tkPref = o.value; w.render(); });
    return col;
  }
}
