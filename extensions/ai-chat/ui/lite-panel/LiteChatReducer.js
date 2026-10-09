import LiteToolCards from './LiteToolCards.js';

export default class LiteChatReducer {
  static STATUS_LABELS = {
    'switching-model': 'Switching model…',
    'starting-server': 'Starting local server…',
    'loading-vision': 'Loading vision…',
    'unloading-vision': 'Unloading vision…',
    'waiting-for-slot': 'Waiting for a free slot…',
  };

  static createInitialState() {
    return {
      conversationId: null,
      running: false,
      content: '',
      hasReasoning: false,
      statusPhase: null,
      tools: [],
      done: false,
      finishReason: null,
      error: null,
    };
  }

  static startTurn(state) {
    return {
      ...LiteChatReducer.createInitialState(),
      conversationId: state ? state.conversationId : null,
      running: true,
    };
  }

  static statusLabel(phase) {
    if (!phase) return '';
    return LiteChatReducer.STATUS_LABELS[phase]
      || (phase.charAt(0).toUpperCase() + phase.slice(1).replace(/-/g, ' ') + '…');
  }

  static reduce(state, evt) {
    const p = (evt && evt.payload) || {};
    const handler = LiteChatReducer._EVENTS[evt && evt.type];
    return handler ? handler(state, p) : state;
  }

  static _meta(state, p) {
    return { ...state, conversationId: p.conversationId || state.conversationId };
  }

  static _status(state, p) {
    return { ...state, statusPhase: p.phase || null };
  }

  static _delta(state, p) {
    return { ...state, content: state.content + (p.text || ''), statusPhase: null };
  }

  static _reasoningDelta(state) {
    return { ...state, hasReasoning: true };
  }

  static _rollback(state, p) {
    const chars = Number(p.chars) || 0;
    if (chars <= 0) return state;
    return { ...state, content: state.content.slice(0, Math.max(0, state.content.length - chars)) };
  }

  static _tool(state, p) {
    const tools = LiteToolCards.reduce(state.tools, p);
    return tools === state.tools ? state : { ...state, tools };
  }

  static _artifact(state, p) {
    const card = { tool: 'artifact', status: 'done', summary: p.title || p.name || 'Artifact created' };
    return { ...state, tools: state.tools.concat([card]) };
  }

  static _done(state, p) {
    return {
      ...state,
      running: false,
      done: true,
      statusPhase: null,
      finishReason: p.finishReason || null,
      aborted: !!p.aborted,
      conversationId: p.conversationId || state.conversationId,
    };
  }

  static _error(state, p) {
    return {
      ...state,
      running: false,
      statusPhase: null,
      error: {
        message: p.message || 'request failed',
        code: p.code || null,
        runtimeId: p.runtimeId || null,
        installable: !!p.installable,
      },
    };
  }

  static _EVENTS = {
    meta: LiteChatReducer._meta,
    status: LiteChatReducer._status,
    delta: LiteChatReducer._delta,
    'reasoning-delta': LiteChatReducer._reasoningDelta,
    rollback: LiteChatReducer._rollback,
    tool: LiteChatReducer._tool,
    artifact: LiteChatReducer._artifact,
    done: LiteChatReducer._done,
    error: LiteChatReducer._error,
  };
}
