import ChatIcons from '../ChatIcons.js';
import ChatModals from '../common/ChatModals.js';
import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class ScheduledTaskMenu {
  static RESERVE_PX = 200;

  constructor(ctx) {
    this._ctx = ctx;
  }

  open(e, t) {
    const ctx = this._ctx;
    ctx.popovers.closeAll();
    const menu = Dom.el('div', 'cm-menu');
    menu.appendChild(this._item(ChatIcons.doc + 'View runs', () => ctx.tasks.open(t.id)));
    menu.appendChild(this._item(ChatIcons.edit + 'Edit scheduled task', () => ctx.conversation.open(t.conversationId)));
    menu.appendChild(this._runNowItem(t));
    menu.appendChild(this._toggleItem(t));
    menu.appendChild(this._deleteItem(t));
    ctx.popovers.showMenuAt(menu, e, ScheduledTaskMenu.RESERVE_PX);
  }

  _item(html, action) {
    const item = Dom.el('button', null, html);
    item.addEventListener('click', () => { this._ctx.popovers.closeAll(); action(); });
    return item;
  }

  _runNowItem(t) {
    const item = Dom.el('button', null, ChatIcons.play + 'Run now');
    item.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      let res = null;
      try { res = await this._ctx.api.schedTasks.runNow(t.id); } catch (_) {}
      item.innerHTML = (res && res.success) ? ChatIcons.check + 'Started' : ChatIcons.x + HtmlEscaper.escape((res && res.error) || 'could not start');
      setTimeout(() => this._ctx.popovers.closeAll(), 1200);
    });
    return item;
  }

  _toggleItem(t) {
    const item = Dom.el('button', null, t.enabled ? ChatIcons.pause + 'Pause' : ChatIcons.play + 'Resume');
    item.addEventListener('click', async () => {
      const ctx = this._ctx;
      ctx.popovers.closeAll();
      try { await ctx.api.schedTasks.update(t.id, { enabled: !t.enabled }); } catch (_) {}
      await ctx.convList.refresh();
      if (ctx.state.activeTaskId === t.id) ctx.tasks.open(t.id);
    });
    return item;
  }

  _deleteItem(t) {
    const item = Dom.el('button', 'danger', ChatIcons.trash + 'Delete');
    item.addEventListener('click', async () => {
      const ctx = this._ctx;
      ctx.popovers.closeAll();
      const ok = await ChatModals.confirm(ctx.root, 'Delete the scheduled task "' + t.title
        + '" and its run history? The setup chat stays. This cannot be undone.', { danger: true, confirmLabel: 'Delete' });
      if (!ok) return;
      try { await ctx.api.schedTasks.delete(t.id); } catch (_) {}
      if (ctx.state.activeTaskId === t.id) { ctx.state.activeTaskId = null; ctx.landing.render(); }
      await ctx.convList.refresh();
    });
    return item;
  }
}
