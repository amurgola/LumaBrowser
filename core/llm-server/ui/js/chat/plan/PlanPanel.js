import PlanPanelHtml from './PlanPanelHtml.js';
import ComposerStrip from '../composer/ComposerStrip.js';

export default class PlanPanel extends ComposerStrip {
  static ORDER = 20;
  static META_KEY = 'plan';

  constructor(ctx) {
    super(ctx, 'cm-plan-strip', PlanPanel.ORDER);
    this._plan = null;
    this._collapsed = false;
  }

  reset() {
    this._plan = null;
    this.unmount();
  }

  async refresh() {
    const { api, state } = this._ctx;
    const conversationId = state.activeId;
    const plan = await PlanPanel._stored(api, conversationId);
    if (state.activeId !== conversationId) return;
    this._plan = plan;
    this.paint();
  }

  onEvent(payload) {
    const p = payload || {};
    if (!p.conversationId || p.conversationId !== this._ctx.state.activeId) return;
    this._plan = p.plan || null;
    this.paint();
  }

  html() {
    if (!this._plan || this._finished()) return '';
    return PlanPanelHtml.build(this._plan, { collapsed: this._collapsed, canClear: PlanPanel._canWriteMeta(this._ctx.api), working: this._working() });
  }

  onClick(event) {
    if (ComposerStrip.target(event, 'data-plan-clear')) { this._clear().catch(() => {}); return; }
    if (!ComposerStrip.target(event, 'data-plan-toggle')) return;
    this._collapsed = !this._collapsed;
    this.paint();
  }

  _finished() {
    return !PlanPanelHtml.current(PlanPanelHtml.steps(this._plan));
  }

  _working() {
    const { state } = this._ctx;
    return !!(state.streaming && state.streamConvId && state.streamConvId === state.activeId);
  }

  async _clear() {
    const { api, state } = this._ctx;
    const conversationId = state.activeId;
    if (!conversationId || this._working() || !PlanPanel._canWriteMeta(api)) return;
    this._plan = null;
    this.paint();
    const reply = await api.conv.meta.get(conversationId);
    const data = { ...((reply && reply.meta && reply.meta.data) || {}) };
    if (!(PlanPanel.META_KEY in data)) return;
    delete data[PlanPanel.META_KEY];
    await api.conv.meta.set(conversationId, { data });
  }

  static _canWriteMeta(api) {
    const meta = api && api.conv && api.conv.meta;
    return !!(meta && typeof meta.get === 'function' && typeof meta.set === 'function');
  }

  static async _stored(api, conversationId) {
    const meta = api && api.conv && api.conv.meta;
    if (!conversationId || !meta || typeof meta.get !== 'function') return null;
    try {
      const reply = await meta.get(conversationId);
      const plan = reply && reply.meta && reply.meta.data && reply.meta.data[PlanPanel.META_KEY];
      return plan && PlanPanelHtml.steps(plan).length ? plan : null;
    } catch (_) {
      return null;
    }
  }
}
