export default class ChatSubscriptions {
  constructor(ctx) {
    this._ctx = ctx;
    this._unsubChat = null;
    this._unsubServer = null;
  }

  async install() {
    const { api } = this._ctx;
    this._unsubChat = api.onChatEvent((evt) => this._ctx.events.handle(evt));
    await this._tabPreview();
    if (api.onOpenConversation) {
      api.onOpenConversation((conversationId) => {
        if (conversationId) this._ctx.conversation.open(conversationId).catch(() => {});
      });
    }
    if (api.onSchedTasksEvent) api.onSchedTasksEvent((ev) => this._onTaskEvent(ev));
    if (api.onTriggersEvent) api.onTriggersEvent((ev) => this._onTriggerEvent(ev));
    if (api.onServerEvent) this._unsubServer = api.onServerEvent((ev) => this._onServerEvent(ev));
    if (api.onServerState) {
      try { api.onServerState((st) => this._ctx.availability.applyServerState(st)); } catch (_) {}
    }
  }

  async _tabPreview() {
    const { api, state } = this._ctx;
    if (!api.tabPreview) return;
    if (api.tabPreview.onFrame) api.tabPreview.onFrame((payload) => this._ctx.tabPreview.applyFrame(payload));
    if (!api.tabPreview.getEnabled) return;
    try {
      const r = await api.tabPreview.getEnabled();
      state.tabPreviewEnabled = !(r && r.enabled === false);
    } catch (_) {
      state.tabPreviewEnabled = true;
    }
  }

  async _onTaskEvent(ev) {
    const ctx = this._ctx;
    await ctx.convList.refresh();
    const tid = ev && ev.payload && ev.payload.taskId;
    if (ctx.state.activeTaskId && (!tid || tid === ctx.state.activeTaskId)) ctx.tasks.open(ctx.state.activeTaskId).catch(() => {});
    ctx.main.syncActiveTitle();
  }

  async _onTriggerEvent(ev) {
    const ctx = this._ctx;
    await ctx.convList.refresh();
    const tid = ev && ev.payload && ev.payload.triggerId;
    if (ev && ev.type === 'open' && tid) { ctx.triggers.open(tid).catch(() => {}); return; }
    if (ctx.state.activeTriggerId && (!tid || tid === ctx.state.activeTriggerId)) ctx.triggers.open(ctx.state.activeTriggerId).catch(() => {});
    ctx.main.syncActiveTitle();
  }

  _onServerEvent(ev) {
    const ctx = this._ctx;
    if (ev && ev.type === 'providers-changed') ctx.models.refresh();
    if (!(ev && ev.type === 'state-change')) return;
    const stNow = ev.payload && ev.payload.state;
    ctx.thinkPill.load({ onlyIfUnknown: stNow !== 'ready' });
    ctx.availability.applyServerState(ev.payload || ev.state || ev);
    ctx.models.refresh();
  }
}
