export default class HostTurns {
  static PROVIDER = 'background-task';
  static KEEP = 8;

  constructor(ctx) {
    this._ctx = ctx;
    this._awaited = new Map();
  }

  async follow(payload) {
    const { api } = this._ctx;
    const { conversationId = null, requestId = null } = payload || {};
    if (!conversationId || !requestId || !api.convJobs || typeof api.convJobs.followTurn !== 'function') return;
    const reply = await api.convJobs.followTurn(requestId);
    if (!reply || reply.success === false) return;
    this._awaited.set(requestId, { conversationId, opening: HostTurns.openingMessage(reply.notice) });
    while (this._awaited.size > HostTurns.KEEP) this._awaited.delete(this._awaited.keys().next().value);
  }

  begin(requestId) {
    const turn = this._awaited.get(requestId);
    if (!turn) return false;
    this._awaited.delete(requestId);
    if (this._ctx.state.streaming) return false;
    if (this._onScreen(turn.conversationId)) this._ctx.sender.showHostTurn(turn.opening, requestId);
    else this._ctx.sender.trackHostTurn(turn.conversationId, requestId);
    return true;
  }

  static openingMessage(notice) {
    const n = notice || {};
    return { role: 'user', content: n.content || '', provider: HostTurns.PROVIDER, toolCalls: n.toolCalls || null };
  }

  _onScreen(conversationId) {
    const { state, els } = this._ctx;
    return state.activeId === conversationId && !!(els.scroll && els.scroll.querySelector('.cm-thread'));
  }
}
