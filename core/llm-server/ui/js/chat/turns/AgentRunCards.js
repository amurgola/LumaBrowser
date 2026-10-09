import ChatIcons from '../ChatIcons.js';
import SelectorText from '../common/SelectorText.js';
import ToolLabels from './ToolLabels.js';
import TurnData from './TurnData.js';
import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';
import MarkdownRenderer from '../../markdown/MarkdownRenderer.js';

export default class AgentRunCards {
  static create(m) {
    const runs = TurnData.agentRuns(m);
    if (!runs.length) return null;
    const box = Dom.el('div', 'cm-agentruns');
    for (const run of runs) box.appendChild(AgentRunCards._build(run));
    return box;
  }

  static sync(turnEl, m) {
    const asst = turnEl.querySelector('.cm-asst');
    const body = turnEl.querySelector('.cm-asst-body');
    const runs = TurnData.agentRuns(m);
    if (!asst || !body || !runs.length) return;
    let box = asst.querySelector('.cm-agentruns');
    if (!box) { box = Dom.el('div', 'cm-agentruns'); asst.insertBefore(box, body); }
    for (const run of runs) {
      const card = box.querySelector('.cm-agent[data-aid="' + SelectorText.attrValue(run.invocationId) + '"]');
      if (!card) box.appendChild(AgentRunCards._build(run));
      else AgentRunCards._update(card, run);
    }
  }

  static _build(run) {
    const card = Dom.el('div', 'cm-agent');
    card.dataset.aid = run.invocationId;
    card.dataset.done = '';
    const head = Dom.el('button', 'cm-agent-head');
    head.addEventListener('click', () => {
      const willOpen = !card.classList.contains('open');
      card.classList.toggle('open', willOpen);
      run._open = willOpen;
      run._userToggled = true;
    });
    const body = Dom.el('div', 'cm-agent-body');
    body.appendChild(AgentRunCards._thinkSection(run));
    body.appendChild(Dom.el('div', 'cm-agent-steps'));
    body.appendChild(Dom.el('div', 'cm-agent-text'));
    card.appendChild(head);
    card.appendChild(body);
    AgentRunCards._update(card, run);
    return card;
  }

  static _thinkSection(run) {
    const think = Dom.el('div', 'cm-agent-think');
    const sum = Dom.el('button', 'cm-agent-think-sum', 'Thinking');
    sum.addEventListener('click', () => { think.classList.toggle('open'); run._thinkToggled = true; });
    think.appendChild(sum);
    think.appendChild(Dom.el('div', 'cm-agent-think-body'));
    return think;
  }

  static _update(card, run) {
    const running = !run.done;
    if (running) card.classList.add('open');
    else if (!run._userToggled) card.classList.remove('open');
    card.classList.toggle('running', running);
    AgentRunCards._updateHead(card, run, running);
    AgentRunCards._updateThinking(card, run, running);
    AgentRunCards._updateSteps(card, run);
    card.querySelector('.cm-agent-text').innerHTML = MarkdownRenderer.render(run.body || '', { streaming: running }) || (running ? ChatIcons.pulse() : '');
    if (run.error) AgentRunCards._showError(card, run.error);
  }

  static _updateHead(card, run, running) {
    const doneFlag = run.done ? (run.error ? 'err' : 'ok') : 'run';
    if (card.dataset.done === doneFlag) return;
    card.dataset.done = doneFlag;
    const ic = doneFlag === 'run' ? '<span class="cm-tc-spin"></span>'
      : doneFlag === 'err' ? '<span class="cm-chain-bang">!</span>' : ChatIcons.check;
    const name = HtmlEscaper.escape(run.agentName || 'Agent');
    const label = running ? name + ' is working…' : run.error ? name + ' failed' : 'Used ' + name;
    card.querySelector('.cm-agent-head').innerHTML = '<span class="cm-agent-ic">' + ic + '</span>'
      + '<span class="cm-agent-label">' + label + '</span>'
      + '<span class="cm-chain-caret">' + ChatIcons.chevron + '</span>';
  }

  static _updateThinking(card, run, running) {
    const think = card.querySelector('.cm-agent-think');
    if (!run.thinking) { think.hidden = true; return; }
    think.hidden = false;
    const tb = think.querySelector('.cm-agent-think-body');
    if (tb.textContent !== run.thinking) { tb.textContent = run.thinking; tb.scrollTop = tb.scrollHeight; }
    if (!run._thinkToggled) think.classList.toggle('open', running && !run.body);
  }

  static _updateSteps(card, run) {
    const stepsEl = card.querySelector('.cm-agent-steps');
    const sig = run.steps.map((s) => s.tool + ':' + s.status).join('|');
    if (stepsEl.dataset.sig === sig) return;
    stepsEl.dataset.sig = sig;
    stepsEl.innerHTML = run.steps.map((s) => '<span class="cm-agent-step ' + (s.status || 'run') + '">'
      + HtmlEscaper.escape(ToolLabels.agentStepLabel(s.tool)) + '</span>').join('');
  }

  static _showError(card, error) {
    let er = card.querySelector('.cm-agent-err');
    if (!er) { er = Dom.el('div', 'cm-agent-err'); card.querySelector('.cm-agent-body').appendChild(er); }
    er.textContent = '[' + error + ']';
  }
}
