import ChatIcons from '../ChatIcons.js';
import ActionButton from '../common/ActionButton.js';
import ScheduledTaskView from './ScheduledTaskView.js';
import TriggerHeaderHtml from './TriggerHeaderHtml.js';
import Clipboard from '../../dom/Clipboard.js';
import Dom from '../../dom/Dom.js';

export default class TriggerView {
  constructor(ctx) {
    this._ctx = ctx;
  }

  async open(triggerId) {
    const ctx = this._ctx;
    const { api, state } = ctx;
    if (!api.triggers) return;
    ScheduledTaskView.enterRunsView(ctx, true);
    state.activeTriggerId = triggerId;
    const info = await this._fetchTrigger(triggerId);
    if (!info.t) {
      state.activeTriggerId = null;
      ctx.landing.render();
      ctx.convList.render(state.conversations);
      return;
    }
    const lists = await this._fetchLists(triggerId);
    this._render(info, lists);
    ctx.convList.render(state.conversations);
    ctx.codeSurface.report();
  }

  async _fetchTrigger(triggerId) {
    try {
      const r = await this._ctx.api.triggers.get(triggerId);
      const t = (r && r.success && r.trigger) || null;
      if (t) t._agent = (r && r.agent) || null;
      return { t, baseUrls: (r && r.baseUrls) || null, watch: (r && r.watch) || null, secret: (r && r.secret) || null, pending: (r && r.pending) || null };
    } catch (_) {
      return { t: null };
    }
  }

  async _fetchLists(triggerId) {
    const triggers = this._ctx.api.triggers;
    const runs = await TriggerView._list(() => triggers.runs(triggerId, { limit: 100 }), 'runs');
    let deliveries = [];
    let deliveryCounts = {};
    try {
      const d = await triggers.deliveries(triggerId, { limit: 60 });
      deliveries = (d && d.success && d.deliveries) || [];
      deliveryCounts = (d && d.success && d.counts) || {};
    } catch (_) {}
    const versions = await TriggerView._list(() => triggers.versions(triggerId), 'versions');
    return { runs, deliveries, deliveryCounts, versions };
  }

  static async _list(call, key) {
    try {
      const r = await call();
      return (r && r.success && r[key]) || [];
    } catch (_) {
      return [];
    }
  }

  _render(info, lists) {
    const { els } = this._ctx;
    this._ctx.main.showStaticView(info.t.title);
    const view = Dom.el('div', 'cm-sched-view');
    const head = Dom.el('div', 'cm-sched-head');
    head.innerHTML = TriggerHeaderHtml.html(info);
    this._wireHead(head, info);
    view.appendChild(head);
    this._ctx.triggerSections.appendAll(view, { t: info.t, ...lists });
    els.scroll.appendChild(view);
    els.scroll.scrollTop = 0;
  }

  _wireHead(head, info) {
    const { t } = info;
    const api = this._ctx.api;
    const reopen = async () => { await this._ctx.convList.refresh(); this.open(t.id); };
    head.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
      const ok = await Clipboard.copyText(b.dataset.copy);
      b.innerHTML = ok ? ChatIcons.check : ChatIcons.x;
      setTimeout(() => { b.innerHTML = ChatIcons.copy; }, 1500);
    }));
    this._on(head, '[data-act="adopt"]', (btn) => ActionButton.run(btn, () => api.triggers.adoptLatestEvent(t.id),
      { fallback: 'could not adopt', plainText: true, onSuccess: reopen }));
    head.querySelectorAll('[data-approve]').forEach((b) => b.addEventListener('click', () => ActionButton.run(b,
      () => api.triggers.approve(info.pending.approval.runId, b.dataset.approve), { fallback: 'could not answer', onSuccess: reopen })));
    this._on(head, '[data-act="secret"]', (btn) => this._saveSecret(head, btn, t, reopen));
    this._on(head, '[data-act="test"]', (btn) => ActionButton.run(btn, () => api.triggers.test(t.id),
      { fallback: 'could not start', restoreHtml: ChatIcons.play + 'Send test event' }));
    this._on(head, '[data-act="arm"]', (btn) => ActionButton.run(btn, () => api.triggers.update(t.id, { enabled: true }),
      { fallback: 'could not arm', keepEnabled: true, onSuccess: reopen }));
    this._on(head, '[data-act="pause"]', async () => {
      try { await api.triggers.update(t.id, { enabled: false }); } catch (_) {}
      await reopen();
    });
    this._on(head, '[data-act="edit"]', () => this._ctx.conversation.open(t.conversationId));
  }

  _on(head, selector, handler) {
    const btn = head.querySelector(selector);
    if (btn) btn.addEventListener('click', () => handler(btn));
  }

  async _saveSecret(head, btn, t, reopen) {
    const inp = head.querySelector('[data-secret]');
    const value = inp ? inp.value.trim() : '';
    if (!value) {
      btn.innerHTML = ChatIcons.x + 'Nothing entered';
      setTimeout(() => { btn.innerHTML = 'Save'; }, 1500);
      return;
    }
    await ActionButton.run(btn, () => this._ctx.api.triggers.setSecret(t.id, value),
      { fallback: 'could not save', restoreHtml: 'Save', onSuccess: reopen });
  }
}
