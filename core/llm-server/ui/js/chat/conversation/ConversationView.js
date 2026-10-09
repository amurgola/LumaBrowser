import ComposerView from '../composer/ComposerView.js';
import Dom from '../../dom/Dom.js';

export default class ConversationView {
  constructor(ctx) {
    this._ctx = ctx;
  }

  async open(id) {
    const ctx = this._ctx;
    const { state } = ctx;
    this._leaveCurrent();
    const reattach = !!(state.streaming && state.streamMsg && state.streamConvId === id);
    state.activeId = id;
    state.activeTaskId = null;
    state.activeTriggerId = null;
    const msgs = await this._loadMessages(id);
    state.messages = msgs.map((m) => this._toStateMessage(m));
    if (reattach) this._spliceLiveMessage();
    if (!state.streaming) state.firstTurn = false;
    state.lastUsage = ConversationView._lastUsage(msgs);
    const conv = state.conversations.find((c) => c.id === id);
    this._restoreOptions(conv);
    await this._restoreMode(conv, id);
    await ctx.docs.restore(id);
    this.render(conv ? conv.title : 'Conversation');
    if (reattach) this._reattachStream();
    this._applyMode();
    ctx.convList.repaintCurrent();
    ctx.codeSurface.report();
  }

  render(title) {
    const { els, state } = this._ctx;
    this._ctx.main.showTitle(title || 'Conversation');
    if (els.artifactsBtn) els.artifactsBtn.style.display = '';
    this._ctx.artsSidebar.refreshTopbarCount();
    els.scroll.innerHTML = '';
    const thread = Dom.el('div', 'cm-thread');
    for (const m of state.messages) thread.appendChild(this._ctx.turns.render(m));
    thread.appendChild(Dom.el('div', 'cm-thread-foot'));
    els.scroll.appendChild(thread);
    els.composerBar.style.display = '';
    els.composerBar.innerHTML = ComposerView.html(false);
    this._ctx.composer.wire(els.composerBar);
    state.autoScrollPaused = false;
    this._ctx.main.pinBottom();
  }

  newChat() {
    const ctx = this._ctx;
    const { state } = ctx;
    if (state.streaming) return;
    ctx.voice.stopReading();
    if (state.sideMode === 'artifacts') ctx.artsSidebar.returnToChats();
    ctx.theme.clear();
    ctx.launcher.leaveActive();
    state.enterPlainChat();
    state.resetChatOptions(true);
    state.newModesOpen = true;
    ctx.landing.render();
    ctx.convList.render(state.conversations);
  }

  _leaveCurrent() {
    const ctx = this._ctx;
    ctx.launcher.leaveActive();
    ctx.popovers.closeAll();
    ctx.voice.stopReading();
    ctx.panel.close();
    ctx.liveArtifacts.dispose();
    ctx.previewSlot.release();
  }

  async _loadMessages(id) {
    try {
      const r = await this._ctx.api.conv.messages(id);
      return (r && r.success && r.messages) || [];
    } catch (_) {
      return [];
    }
  }

  _toStateMessage(m) {
    const { state } = this._ctx;
    return {
      role: m.role, content: m.content || '', reasoning: m.reasoning || '', error: m.error || '',
      toolCalls: m.toolCalls || null,
      id: m.id || null,
      variantGroup: m.variantGroup || null,
      variantCount: m.variantCount || 0,
      variantIndex: m.variantIndex || 0,
      tokensIn: m.tokensIn != null ? m.tokensIn : null,
      tokensOut: m.tokensOut != null ? m.tokensOut : null,
      timings: m.id && state.timingsByMsgId.has(m.id) ? state.timingsByMsgId.get(m.id) : null,
      _preview: m.id && state.previewByMsgId.has(m.id) ? state.previewByMsgId.get(m.id) : null,
    };
  }

  _spliceLiveMessage() {
    const { state } = this._ctx;
    const live = state.streamMsg;
    const i = live.id ? state.messages.findIndex((m) => m.role === 'assistant' && m.id === live.id) : -1;
    if (i >= 0) state.messages[i] = live;
    else state.messages.push(live);
  }

  static _lastUsage(msgs) {
    const lastA = [...msgs].reverse().find((m) => m.role === 'assistant' && (m.tokensIn || m.tokensOut));
    return lastA ? { in: lastA.tokensIn || 0, out: lastA.tokensOut || 0, window: null } : null;
  }

  _restoreOptions(conv) {
    const { state } = this._ctx;
    if (conv && conv.modelRef && state.models.some((m) => m.ref === conv.modelRef)) state.modelRef = conv.modelRef;
    state.activeMode = (conv && conv.mode) || 'chat';
    state.toolsOn = state.activeMode === 'chat' ? true : !!(conv && conv.toolsEnabled);
    state.disabledTools = (conv && Array.isArray(conv.disabledTools)) ? conv.disabledTools.slice() : [];
    state.choicesEnabled = (conv && conv.choicesEnabled != null) ? !!conv.choicesEnabled : true;
    state.reasoningEffort = (conv && conv.reasoningEffort) || null;
    this._ctx.thinkPill.render();
    this._ctx.thinkPill.syncToModel();
  }

  async _restoreMode(conv, id) {
    const { state, api } = this._ctx;
    state.activeModeDef = null;
    state.activeMeta = null;
    if (!state.activeMode || state.activeMode === 'chat' || !this._ctx.chatExt()) return;
    state.activeModeDef = this._ctx.modeDef(state.activeMode);
    try {
      const r = await api.conv.meta.get(id);
      if (r && r.success) state.activeMeta = r.meta;
    } catch (_) {}
  }

  _reattachStream() {
    const { els, state } = this._ctx;
    const thread = els.scroll.querySelector('.cm-thread');
    const idx = state.messages.indexOf(state.streamMsg);
    const stale = thread && idx >= 0 ? thread.children[idx] : null;
    this._ctx.stream.append({ replace: stale || null });
    this._ctx.composer.setSendStop(true);
    this._ctx.stream.scheduleRender();
  }

  _applyMode() {
    const { state, modeCtx, theme } = this._ctx;
    if (state.activeMode === 'chat') { theme.clear(); return; }
    theme.apply();
    modeCtx.callHook('decorateComposer', modeCtx.composerEls(), modeCtx.forHooks());
    modeCtx.callHook('onOpenConversation', state.activeMeta, modeCtx.forHooks());
  }
}
