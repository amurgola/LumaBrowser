import ChatIcons from '../ChatIcons.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class PlanPanelHtml {
  static COMPLETED = 'completed';
  static IN_PROGRESS = 'in_progress';

  static STATE_WORDS = { completed: 'Done', in_progress: 'In progress' };

  static build(plan, { collapsed = false, canClear = false, working = false } = {}) {
    const steps = PlanPanelHtml.steps(plan);
    if (!steps.length) return '';
    const done = steps.filter((step) => step.status === PlanPanelHtml.COMPLETED).length;
    return PlanPanelHtml._head(steps, done, { collapsed, canClear, working })
      + PlanPanelHtml._bar(done, steps.length)
      + (collapsed ? '' : PlanPanelHtml._list(steps) + PlanPanelHtml._why(plan));
  }

  static steps(plan) {
    const list = plan && Array.isArray(plan.steps) ? plan.steps : [];
    return list.filter((step) => step && typeof step.text === 'string' && step.text);
  }

  static current(steps) {
    return steps.find((step) => step.status === PlanPanelHtml.IN_PROGRESS)
      || steps.find((step) => step.status !== PlanPanelHtml.COMPLETED)
      || null;
  }

  static _head(steps, done, { collapsed, canClear, working }) {
    const esc = HtmlEscaper.escape;
    const current = collapsed ? PlanPanelHtml.current(steps) : null;
    return '<div class="cm-plan-head">'
      + `<button class="cm-plan-toggle" type="button" data-plan-toggle aria-expanded="${collapsed ? 'false' : 'true'}" title="${collapsed ? 'Show the steps' : 'Hide the steps'}">${ChatIcons.chevron}</button>`
      + '<span class="cm-plan-title">Plan</span>'
      + `<span class="cm-plan-count">${done} of ${steps.length} done</span>`
      + `<span class="cm-plan-now">${current ? esc(current.text) : ''}</span>`
      + (canClear ? `<button class="cm-plan-clear" type="button" data-plan-clear${working ? ' disabled title="Wait for the reply to finish"' : ''}>Clear</button>` : '')
      + '</div>';
  }

  static _bar(done, total) {
    const percent = Math.round((done / total) * 100);
    return `<div class="cm-plan-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}">`
      + `<div class="cm-plan-bar-fill" style="width:${percent}%"></div></div>`;
  }

  static _list(steps) {
    return '<ol class="cm-plan-steps">' + steps.map((step) => PlanPanelHtml._step(step)).join('') + '</ol>';
  }

  static _step(step) {
    const esc = HtmlEscaper.escape;
    const kind = step.status === PlanPanelHtml.COMPLETED ? 'is-done' : (step.status === PlanPanelHtml.IN_PROGRESS ? 'is-current' : 'is-todo');
    const word = PlanPanelHtml.STATE_WORDS[step.status] || '';
    return `<li class="cm-plan-step ${kind}">`
      + `<span class="cm-plan-mark">${step.status === PlanPanelHtml.COMPLETED ? ChatIcons.check : ''}</span>`
      + `<span class="cm-plan-text">${esc(step.text)}</span>`
      + (word ? `<span class="cm-plan-state">${word}</span>` : '')
      + '</li>';
  }

  static _why(plan) {
    const line = plan && typeof plan.explanation === 'string' ? plan.explanation.trim() : '';
    return line ? `<div class="cm-plan-why">${HtmlEscaper.escape(line)}</div>` : '';
  }
}
