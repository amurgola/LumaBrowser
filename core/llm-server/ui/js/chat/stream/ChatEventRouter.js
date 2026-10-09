import AgentEventReducer from './AgentEventReducer.js';
import StatusText from './StatusText.js';
import ToolEventReducer from './ToolEventReducer.js';
import ChatIcons from '../ChatIcons.js';
import TurnTimings from '../turns/TurnTimings.js';
import Dom from '../../dom/Dom.js';

export default class ChatEventRouter {
  constructor(ctx) {
    this._ctx = ctx;
    this._handlers = {
      meta: (p) => this._meta(p),
      status: (p) => this._status(p),
      delta: (p) => this._delta(p),
      'reasoning-delta': (p) => this._reasoning(p),
      rollback: (p) => this._rollback(p),
      tool: (p) => this._tool(p),
      'artifact-stream': (p) => { if (this._ctx.state.streamOnScreen()) this._ctx.panel.stream(p); },
      artifact: (p) => this._artifact(p),
      done: (p) => this._done(p),
      error: (p) => this._ctx.finisher.error((p && p.message) || 'chat error', p),
      agent: (p) => this._agent(p),
    };
  }

  handle(evt) {
    if (!evt || evt.requestId !== this._ctx.state.reqId) return;
    const handler = this._handlers[evt.type];
    if (handler) handler(evt.payload);
    else this._modeEvent(evt);
  }

  _meta(p) {
    if (p && p.conversationId) this._adoptConversation(p.conversationId);
    const msg = this._ctx.state.streamMsg;
    if (p && p.assistantMessageId && msg) {
      msg.id = p.assistantMessageId;
      const el = this._ctx.stream.turnEl();
      if (el) el.dataset.msgId = p.assistantMessageId;
    }
    if (p && p.userMessageId) this._adoptUserTurn(p);
  }

  _adoptConversation(cid) {
    const { state } = this._ctx;
    const minted = !state.streamConvId;
    state.streamConvId = cid;
    if (state.activeId == null && !this._ctx.landing.isShowing()) state.activeId = cid;
    if (minted && !state.conversations.some((c) => c.id === cid)) this._ctx.convList.refresh();
  }

  _adoptUserTurn(p) {
    const u = [...this._ctx.state.messages].reverse().find((m) => m.role === 'user' && !m.id);
    const arts = Array.isArray(p.userArtifacts) && p.userArtifacts.length ? p.userArtifacts : null;
    if (u) {
      u.id = p.userMessageId;
      if (arts) u.toolCalls = Object.assign({}, u.toolCalls, { artifacts: arts });
      this._ctx.userTurns.adoptId(u);
    }
    if (!arts) return;
    this._ctx.artsSidebar.repaintIfShowing();
    this._ctx.artsSidebar.refreshTopbarCount();
  }

  _status(p) {
    const turnEl = this._ctx.stream.turnEl();
    const msg = this._ctx.state.streamMsg;
    if (p && p.phase === 'compacted') { this._compacted(turnEl, p); return; }
    if (!turnEl || !msg || msg.content) return;
    turnEl.querySelector('.cm-asst-body').innerHTML = ChatIcons.pulse() + ' ' + StatusText.forPhase(p && p.phase);
  }

  _compacted(turnEl, p) {
    if (!turnEl || !turnEl.parentElement) return;
    const prev = turnEl.previousElementSibling;
    if (prev && prev.classList && prev.classList.contains('cm-compacted-pill')) return;
    const pill = Dom.el('div', 'cm-compacted-pill', StatusText.COMPACTED);
    pill.title = StatusText.compactedTitle(p.removed);
    turnEl.parentElement.insertBefore(pill, turnEl);
    this._ctx.main.maybeScroll();
  }

  _delta(p) {
    const msg = this._ctx.state.streamMsg;
    if (!msg) return;
    const t = (p && p.text) || '';
    msg.content += t;
    this._ctx.voice.onDelta(t);
    this._ctx.stream.write(t);
    this._ctx.stream.scheduleRender();
  }

  _reasoning(p) {
    const msg = this._ctx.state.streamMsg;
    if (!msg) return;
    msg.reasoning += (p && p.text) || '';
    msg._reasonAt = Date.now();
    this._ctx.stream.scheduleRender();
  }

  _rollback(p) {
    const msg = this._ctx.state.streamMsg;
    if (!msg || !p || !p.chars) return;
    const n = Math.min(p.chars, msg.content.length);
    msg.content = n >= msg.content.length ? '' : msg.content.slice(0, -n);
    this._ctx.stream.rewind(n);
    this._ctx.stream.scheduleRender();
  }

  _tool(p) {
    const { state } = this._ctx;
    const msg = state.streamMsg;
    if (!msg) return;
    const payload = p || {};
    if (!msg.tools) msg.tools = [];
    this._announceTool(msg, payload);
    const result = ToolEventReducer.apply(msg, payload);
    if (result.tabEnded) {
      this._ctx.previewSlot.release();
      if (msg.id) state.previewByMsgId.set(msg.id, msg._preview);
    }
    this._ctx.stream.scheduleRender();
  }

  _announceTool(msg, p) {
    if (p.phase !== 'approval' && p.phase !== 'run' && p.phase !== 'done') return;
    const { state } = this._ctx;
    const step = p.phase !== 'done' ? p : ToolEventReducer.openStep(msg, p.tool);
    try {
      window.dispatchEvent(new CustomEvent('luma-chat-tool', { detail: {
        conversationId: state.streamConvId || state.activeId || null, phase: p.phase, tool: p.tool,
        params: (step && step.params) || null, success: p.phase === 'done' ? !!p.success : undefined,
      } }));
    } catch (_) {}
  }

  _artifact(p) {
    const { state } = this._ctx;
    const msg = state.streamMsg;
    if (!msg) return;
    if (!msg.artifacts) msg.artifacts = [];
    if (p && p.id) {
      msg.artifacts.push(p);
      if ((p.type || '') !== 'live' && state.streamOnScreen()) this._ctx.panel.open(p);
      this._ctx.artsSidebar.repaintIfShowing();
      this._ctx.artsSidebar.refreshTopbarCount();
    }
    this._ctx.stream.scheduleRender();
  }

  _done(p) {
    this._recordUsage(p && p.usage, p);
    this._recordTimings(p && p.timings);
    this._ctx.finisher.done(p && p.aborted);
  }

  _recordUsage(u, p) {
    if (!u) return;
    const { state } = this._ctx;
    const inTok = u.prompt_tokens != null ? u.prompt_tokens : u.input_tokens;
    const outTok = u.completion_tokens != null ? u.completion_tokens : u.output_tokens;
    if (state.streamOnScreen()) state.lastUsage = { in: inTok, out: outTok, window: (p && p.contextWindow) || null };
    if (state.streamMsg) {
      state.streamMsg.tokensIn = inTok;
      state.streamMsg.tokensOut = outTok;
    }
    if (state.streamOnScreen()) this._ctx.usage.render();
  }

  _recordTimings(t) {
    const { state } = this._ctx;
    if (!t || !state.streamMsg) return;
    const norm = TurnTimings.normalize(t);
    state.streamMsg.timings = norm;
    if (norm && state.streamMsg.id) state.timingsByMsgId.set(state.streamMsg.id, norm);
  }

  _agent(p) {
    const msg = this._ctx.state.streamMsg;
    if (!msg) return;
    AgentEventReducer.apply(msg, p);
    this._ctx.stream.scheduleRender();
  }

  _modeEvent(evt) {
    const { state } = this._ctx;
    if (!state.streamOnScreen()) return;
    this._ctx.modeCtx.callHook('onChatEvent', { type: evt.type, payload: evt.payload }, this._ctx.modeCtx.forEvents());
  }
}
