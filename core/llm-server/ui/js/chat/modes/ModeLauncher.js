import Dom from '../../dom/Dom.js';
import Dialogs from '../../dialogs/Dialogs.js';

export default class ModeLauncher {
  constructor(ctx) {
    this._ctx = ctx;
    this._consumingIntent = false;
  }

  async start(modeId, presetData) {
    const def = this._ctx.modeDef(modeId);
    if (!def) { this._ctx.landing.render(); return; }
    if (!(await this._preflightPassed(def))) return;
    const data = await this._setupData(def, presetData);
    if (data == null) return;
    const conv = await this._createConversation(def, modeId, data);
    if (!conv) return;
    await this._activate(conv, def, modeId, data);
    await this._open(def, data);
  }

  async checkPendingIntent() {
    const { api, state } = this._ctx;
    if (!state.modesReady || this._consumingIntent) return;
    this._consumingIntent = true;
    try {
      const intent = api.chat && api.chat.takeIntent ? await api.chat.takeIntent() : null;
      if (!intent || !intent.mode) return;
      if (this._ctx.modeDef(intent.mode)) await this.start(intent.mode, intent.data || {});
      else console.warn('[chat] pending intent for unknown mode:', intent.mode);
    } catch (err) {
      console.error('[chat] failed to consume pending intent:', err && err.message);
    } finally {
      this._consumingIntent = false;
    }
  }

  leaveActive() {
    this._ctx.attachments.clearContext();
    const def = this._ctx.state.activeModeDef;
    if (!def || typeof def.onLeaveConversation !== 'function') return;
    try { def.onLeaveConversation(this._ctx.modeCtx.forHooks()); } catch (err) {
      console.error('[chat] mode onLeaveConversation failed:', err && err.message);
    }
  }

  async _preflightPassed(def) {
    let pf;
    try { pf = def.preflight ? await def.preflight(this._ctx.api) : await this._ctx.preflight.run(def.requirements); }
    catch (_) { pf = { ok: true, missing: [] }; }
    if (pf && !pf.ok) { this._ctx.preflight.showBlock(def, pf.missing || []); return false; }
    return true;
  }

  async _setupData(def, presetData) {
    if (presetData && typeof presetData === 'object') return presetData;
    const prevConvId = this._ctx.state.activeId;
    let view = null;
    const host = () => (view || (view = this._setupView(def)));
    const restore = () => {
      if (!view) return;
      if (prevConvId) this._ctx.conversation.open(prevConvId);
      else this._ctx.landing.render();
    };
    let data = {};
    try {
      data = await this._runSetup(def, host);
    } catch (err) {
      console.error('[chat] mode setup failed:', err);
      restore();
      return null;
    }
    if (data == null) restore();
    return data;
  }

  async _runSetup(def, host) {
    const ctx = this._ctx;
    const ext = ctx.chatExt();
    if (typeof def.openSetup === 'function') {
      const hookCtx = ctx.modeCtx.forHooks();
      hookCtx.setupHost = host;
      return def.openSetup(ctx.api, hookCtx);
    }
    if (def.setupSchema && ext && ext.openSchemaInline) {
      return ext.openSchemaInline(def.setupSchema, { api: ctx.api, title: def.label, host: host() });
    }
    return {};
  }

  _setupView(def) {
    this._ctx.popovers.closeAll();
    this._ctx.panel.close();
    this._ctx.main.showStaticView(def.label || def.id);
    const view = Dom.el('div', 'cm-setup-view');
    this._ctx.els.scroll.appendChild(view);
    return view;
  }

  async _createConversation(def, modeId, data) {
    const api = this._ctx.api;
    let conv = null;
    try {
      const r = await api.conv.create({ mode: modeId });
      conv = r && r.success && r.conversation;
    } catch (_) {}
    if (!conv) { Dialogs.alert('Could not start ' + (def.label || modeId) + '.'); return null; }
    try { await api.conv.meta.set(conv.id, { mode: modeId, data }); } catch (_) {}
    return conv;
  }

  async _activate(conv, def, modeId, data) {
    const ctx = this._ctx;
    const { state } = ctx;
    this.leaveActive();
    state.activeId = conv.id;
    state.activeTaskId = null;
    state.activeTriggerId = null;
    state.activeMode = modeId;
    state.activeModeDef = def;
    state.activeMeta = { mode: modeId, data };
    state.messages = [];
    state.lastUsage = null;
    state.resetChatOptions(def.agent === true);
    if (!state.modelRef) state.modelRef = state.defaultRef;
    await ctx.convList.refresh();
    ctx.conversation.render(conv.title || def.label || 'Conversation');
    ctx.theme.apply();
    ctx.codeSurface.report();
    ctx.modeCtx.callHook('decorateComposer', ctx.modeCtx.composerEls(), ctx.modeCtx.forHooks());
  }

  async _open(def, data) {
    const ctx = this._ctx;
    ctx.state.firstTurn = typeof def.startConversation === 'function';
    if (!ctx.state.firstTurn) return;
    try { await def.startConversation(ctx.api, ctx.modeCtx.forHooks(), data); } catch (err) {
      console.error('[chat] mode startConversation failed:', err);
    }
  }
}
