import ChatIcons from '../ChatIcons.js';
import ChatModals from '../common/ChatModals.js';
import TriggerText from '../tasks/TriggerText.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';
import ConversationGroups from './ConversationGroups.js';

export default class ConversationList {
  constructor(ctx) {
    this._ctx = ctx;
    this._source = [];
  }

  registerTemplates() {
    const R = this._ctx.resonant;
    R.transform('cmConvTitle', (title, item) =>
      (item.pinned ? '<span class="cm-pin-dot">&#9679;</span> ' : '') + HtmlEscaper.escape(title));
    R.registerTemplate('cmConvRow', ConversationList.ROW_TEMPLATE);
    R.registerTemplate('cmEmptyChats', '<div class="cm-empty">No conversations yet</div>');
    R.handler('open', (item) => this._open(item));
    R.handler('menu', (item, e) => this._menu(item, e));
    R.handler('groupdel', (item, e) => { e.stopPropagation(); this.deleteGroup(item._head); });
  }

  registerList() {
    this._ctx.resonant.add('cm', { visible: [] });
  }

  render(list) {
    this._source = list || [];
    this._ctx.artsSidebar.applyMode();
    this.rebuild();
  }

  rebuild() {
    const rows = this._ctx.state.searchOn ? [] : this._taskRows().concat(this._triggerRows());
    const all = rows.concat(this._conversationRows());
    try { this._ctx.resonant.data.cm.visible.update(all); } catch (_) {}
    this._ctx.sideModes.applyActive();
  }

  async refresh() {
    const { api, state } = this._ctx;
    state.conversations = await ConversationList._listed(() => api.conv.list({}), 'conversations');
    if (api.schedTasks) state.schedTasks = await ConversationList._listed(() => api.schedTasks.list(), 'tasks');
    if (api.triggers) state.triggers = await ConversationList._listed(() => api.triggers.list(), 'triggers');
    this.repaintCurrent();
  }

  repaintCurrent() {
    const { state, artsSidebar } = this._ctx;
    if (state.sideMode === 'artifacts') artsSidebar.renderScoped();
    else if (state.sideMode === 'all-artifacts') artsSidebar.renderAll();
    else this.render(state.conversations);
  }

  async search(q) {
    const term = (q || '').trim();
    if (!term) { this.render(this._ctx.state.conversations); return; }
    try {
      const r = await this._ctx.api.conv.search(term, {});
      this.render((r && r.success && r.conversations) || []);
    } catch (_) {
      this.render([]);
    }
  }

  async deleteGroup(label) {
    if (!label) return;
    const items = this._source.filter((c) => ConversationGroups.groupOf(c) === label);
    if (!items.length) return;
    const n = items.length;
    const ok = await ChatModals.confirm(this._ctx.root,
      'Delete ' + n + ' conversation' + (n === 1 ? '' : 's') + ' in "' + label + '"? This cannot be undone.',
      { danger: true, confirmLabel: 'Delete' });
    if (!ok) return;
    const ids = items.map((c) => c.id);
    const wasActive = ids.includes(this._ctx.state.activeId);
    await Promise.all(ids.map((id) => this._ctx.api.conv.delete(id).catch(() => null)));
    if (wasActive) { this._ctx.state.activeId = null; this._ctx.landing.render(); }
    await this.refresh();
  }

  modeTag(mode) {
    if (!mode || mode === 'chat') return '';
    const def = this._ctx.modeDef(mode);
    return (def && def.label) || mode;
  }

  static ROW_TEMPLATE =
    '<div>'
    +   '<div class="cm-recents-head" res-display="_head">'
    +     '<span class="cm-recents-head-label" res-prop="_head"></span>'
    +     '<button type="button" class="cm-recents-head-del" res-display="_canDel" res-onclick="res.groupdel" title="Delete group">' + ChatIcons.trash + '</button>'
    +   '</div>'
    +   '<div class="cm-conv" res-style="active ? \'active\' : \'\'" res-onclick="res.open">'
    +     '<span class="cm-conv-title" res-prop="title" res-format="cmConvTitle"></span>'
    +     '<span class="cm-conv-badge" res-display="badge" res-prop="badge"></span>'
    +     '<span class="cm-conv-tag" res-display="tag" res-prop="tag"></span>'
    +     '<button type="button" class="cm-conv-menu" res-onclick="res.menu" title="More">' + ChatIcons.dots + '</button>'
    +   '</div>'
    + '</div>';

  static async _listed(call, key) {
    try {
      const r = await call();
      return (r && r.success && r[key]) || [];
    } catch (_) {
      return [];
    }
  }

  _taskRows() {
    const { state } = this._ctx;
    return state.schedTasks.map((t, i) => ({
      id: 'stask:' + t.id, taskId: t.id, _task: true,
      title: t.title + (t.enabled ? '' : ' (paused)'),
      pinned: false, badge: String(t.runCount || 0), tag: '',
      active: t.id === state.activeTaskId,
      _head: i === 0 ? 'Scheduled' : '', _canDel: false,
    }));
  }

  _triggerRows() {
    const { state } = this._ctx;
    return state.triggers.map((t, i) => ({
      id: 'trig:' + t.id, triggerId: t.id, _trigger: true,
      title: t.title + TriggerText.suffix(t),
      pinned: false, badge: String(t.enabled ? (t.fireCount || 0) : (t.runCount || 0)), tag: '',
      active: t.id === state.activeTriggerId,
      _head: i === 0 ? 'Triggers' : '', _canDel: false,
    }));
  }

  _conversationRows() {
    const rows = [];
    for (const [g, items] of ConversationGroups.group(this._source)) {
      items.forEach((c, i) => rows.push({
        id: c.id, title: c.title, pinned: !!c.pinned, badge: '', tag: this.modeTag(c.mode),
        active: c.id === this._ctx.state.activeId,
        _head: i === 0 ? g : '', _canDel: i === 0 && g !== ConversationGroups.PINNED,
      }));
    }
    return rows;
  }

  _open(item) {
    if (item._task) { this._ctx.tasks.open(item.taskId); return; }
    if (item._trigger) { this._ctx.triggers.open(item.triggerId); return; }
    this._ctx.conversation.open(item.id);
  }

  _menu(item, e) {
    e.stopPropagation();
    const { state } = this._ctx;
    if (item._task) {
      const task = state.schedTasks.find((t) => t.id === item.taskId);
      if (task) this._ctx.taskMenu.open(e, task);
      return;
    }
    if (item._trigger) {
      const trig = state.triggers.find((t) => t.id === item.triggerId);
      if (trig) this._ctx.triggerMenu.open(e, trig);
      return;
    }
    this._ctx.convMenu.open(e, state.conversations.find((c) => c.id === item.id) || { id: item.id });
  }
}
