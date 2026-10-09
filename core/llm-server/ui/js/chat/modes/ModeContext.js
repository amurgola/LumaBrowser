import SelectorText from '../common/SelectorText.js';

export default class ModeContext {
  constructor(ctx) {
    this._ctx = ctx;
  }

  forHooks() {
    const ctx = this._ctx;
    const { state } = ctx;
    return {
      api: ctx.api,
      get conversationId() { return state.activeId; },
      get modeId() { return state.activeMode; },
      get meta() { return state.activeMeta; },
      get rootEl() { return ctx.els.main; },
      sendTurn: (text) => ctx.sender.submit(text),
      setMeta: (patch) => this._setMeta(patch),
      applyBackground: (b64OrUrl, mime) => ctx.theme.applyBackground(b64OrUrl, mime),
      clearBackground: () => ctx.theme.clear(),
      refresh: () => { if (state.activeId) ctx.conversation.open(state.activeId); },
    };
  }

  forEvents() {
    const base = this.forHooks();
    base.turnElForMessage = (messageId) => {
      if (messageId) {
        const hit = this._ctx.els.scroll.querySelector('.cm-turn[data-msg-id="' + SelectorText.attrValue(messageId) + '"]');
        if (hit) return hit;
      }
      return this._ctx.stream.turnEl();
    };
    base.streamingTurnEl = () => this._ctx.stream.turnEl();
    return base;
  }

  composerEls() {
    const barEl = this._ctx.els.composerBar;
    const bar = barEl && barEl.querySelector('.cm-composer');
    return { composer: bar || null, textarea: bar ? bar.querySelector('textarea') : null, bar: barEl };
  }

  callHook(name, ...args) {
    const def = this._ctx.state.activeModeDef;
    if (!def || typeof def[name] !== 'function') return undefined;
    try { return def[name](...args); } catch (_) { return undefined; }
  }

  async callHookAsync(name, ...args) {
    const def = this._ctx.state.activeModeDef;
    if (!def || typeof def[name] !== 'function') return undefined;
    try { return await def[name](...args); } catch (_) { return undefined; }
  }

  async _setMeta(patch) {
    const { state, api } = this._ctx;
    const data = { ...((state.activeMeta && state.activeMeta.data) || {}), ...((patch && patch.data) || {}) };
    state.activeMeta = { mode: state.activeMode, data };
    try { if (state.activeId) await api.conv.meta.set(state.activeId, state.activeMeta); } catch (_) {}
    return state.activeMeta;
  }
}
