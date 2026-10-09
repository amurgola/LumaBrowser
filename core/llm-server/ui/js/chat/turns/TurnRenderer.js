import AgentRunCards from './AgentRunCards.js';
import ReplyChoices from './ReplyChoices.js';
import ThinkPane from './ThinkPane.js';
import TurnData from './TurnData.js';
import Dom from '../../dom/Dom.js';
import MarkdownRenderer from '../../markdown/MarkdownRenderer.js';

export default class TurnRenderer {
  constructor(ctx) {
    this._ctx = ctx;
  }

  render(m) {
    if (m.role === 'user') return this._ctx.userTurns.render(m);
    return this._assistant(m);
  }

  applyModeExtras(turnEl, m) {
    this._ctx.modeCtx.callHook('renderTurnExtras', turnEl, m, this._ctx.modeCtx.forHooks());
  }

  _assistant(m) {
    const { state } = this._ctx;
    const t = Dom.el('div', 'cm-turn assistant');
    if (m.id) t.dataset.msgId = m.id;
    const a = Dom.el('div', 'cm-asst');
    const live = m === state.streamMsg;
    if (TurnData.hasReasoning(m.reasoning)) a.appendChild(ThinkPane.create(m.reasoning, live, this._ctx.thinkPane.isThinkingNow(m)));
    this._appendIf(a, this._ctx.chain.create(m));
    this._appendIf(a, AgentRunCards.create(m));
    const parsed = ReplyChoices.parse(m.content);
    a.appendChild(Dom.el('div', 'cm-asst-body', MarkdownRenderer.render(parsed.text)));
    this._appendIf(a, this._ctx.artifactChips.create(m));
    if (parsed.choices && !live && !m.error && state.isNewestMessage(m)) a.appendChild(this._ctx.choiceChips.create(parsed.choices));
    if (m.error) this._appendError(a, m);
    if (!live) a.insertAdjacentHTML('beforeend', this._ctx.turnActions.actionRowHtml(m) + this._ctx.turnActions.metaRowHtml(m));
    t.appendChild(a);
    this.applyModeExtras(t, m);
    return t;
  }

  _appendError(a, m) {
    a.appendChild(this._ctx.errorCard.create(m));
    this._appendIf(a, this._ctx.runtimeFix.create(m));
  }

  _appendIf(parent, child) {
    if (child) parent.appendChild(child);
  }
}
