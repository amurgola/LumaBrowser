import ChatIcons from '../ChatIcons.js';
import ConversationMarkdown from './ConversationMarkdown.js';
import ChatModals from '../common/ChatModals.js';
import Clipboard from '../../dom/Clipboard.js';
import Dom from '../../dom/Dom.js';

export default class ConversationMenu {
  static RESERVE_PX = 180;

  constructor(ctx) {
    this._ctx = ctx;
  }

  open(e, c) {
    this._ctx.popovers.closeAll();
    const menu = Dom.el('div', 'cm-menu');
    const flyout = this._shareFlyout(c, menu);
    menu.appendChild(this._renameItem(c));
    menu.appendChild(this._pinItem(c));
    menu.appendChild(flyout.share);
    menu.appendChild(flyout.sub);
    const logs = this._copyLogsItem();
    if (logs) menu.appendChild(logs);
    const restart = Dom.el('button', null, ChatIcons.retry + 'Restart');
    restart.addEventListener('click', () => { this.restart(c); });
    menu.appendChild(restart);
    menu.appendChild(this._deleteItem(c));
    flyout.lateLink();
    this._ctx.popovers.showMenuAt(menu, e, ConversationMenu.RESERVE_PX);
  }

  async restart(c) {
    const ctx = this._ctx;
    ctx.popovers.closeAll();
    if (ctx.state.streaming || !c || !c.id) return;
    const ok = await ChatModals.confirm(ctx.root, 'Restart "' + (c.title || 'this scene')
      + '"? This deletes every message and generated image and begins again.', { danger: true, confirmLabel: 'Restart' });
    if (!ok) return;
    if (c.id !== ctx.state.activeId) { try { await ctx.conversation.open(c.id); } catch (_) {} }
    await ctx.modeCtx.callHookAsync('onRestart', ctx.modeCtx.forEvents());
    try { await ctx.api.conv.clearMessages(c.id); } catch (_) {}
    ctx.state.messages = [];
    try { await ctx.conversation.open(c.id); } catch (_) {}
    await ctx.convList.refresh();
    const data = (ctx.state.activeMeta && ctx.state.activeMeta.data) || {};
    await ctx.modeCtx.callHookAsync('startConversation', ctx.api, ctx.modeCtx.forEvents(), data);
  }

  _renameItem(c) {
    const item = Dom.el('button', null, ChatIcons.edit + 'Rename');
    item.addEventListener('click', async () => {
      const ctx = this._ctx;
      ctx.popovers.closeAll();
      const next = await ChatModals.prompt(ctx.root, 'Rename conversation', c.title);
      if (!next || !next.trim()) return;
      await ctx.api.conv.rename(c.id, next.trim());
      await ctx.convList.refresh();
      if (c.id === ctx.state.activeId) ctx.main.setTitle(next.trim());
    });
    return item;
  }

  _pinItem(c) {
    const item = Dom.el('button', null, ChatIcons.pin + (c.pinned ? 'Unpin' : 'Pin'));
    item.addEventListener('click', async () => {
      this._ctx.popovers.closeAll();
      await this._ctx.api.conv.pin(c.id, !c.pinned);
      await this._ctx.convList.refresh();
    });
    return item;
  }

  _deleteItem(c) {
    const item = Dom.el('button', 'danger', ChatIcons.trash + 'Delete');
    item.addEventListener('click', async () => {
      const ctx = this._ctx;
      ctx.popovers.closeAll();
      const ok = await ChatModals.confirm(ctx.root, 'Delete "' + c.title + '"? This cannot be undone.', { danger: true, confirmLabel: 'Delete' });
      if (!ok) return;
      await ctx.api.conv.delete(c.id);
      if (c.id === ctx.state.activeId) { ctx.state.activeId = null; ctx.landing.render(); }
      await ctx.convList.refresh();
    });
    return item;
  }

  _copyLogsItem() {
    if (!this._ctx.state.debugEnabled) return null;
    const item = Dom.el('button', null, ChatIcons.copy + 'Copy Logs');
    item.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      let lines = [];
      try { const r = await this._ctx.api.debug.getLogs(); lines = (r && r.lines) || []; } catch (_) {}
      this._copyWithFeedback(item, lines.length ? lines.join('\n') : '(no logs captured)');
    });
    return item;
  }

  _shareFlyout(c, menu) {
    const share = Dom.el('button', 'cm-menu-parent', ChatIcons.share + 'Share'
      + '<span class="cm-menu-parent-caret">' + ChatIcons.chevron + '</span>');
    const sub = Dom.el('div', 'cm-menu cm-menu-sub');
    sub.hidden = true;
    const copyMd = this._copyMarkdownItem(c);
    sub.appendChild(copyMd);
    const link = this._linkItem(c);
    if (link && this._ctx.state.shareAvail) sub.appendChild(link);
    for (const item of this._downloadItems(c)) sub.appendChild(item);
    this._wireFlyout(share, sub, menu);
    const lateLink = () => {
      if (!link) return;
      this._ctx.share.refreshStatus().then((ok) => {
        if (ok && !link.isConnected && menu.isConnected) sub.insertBefore(link, copyMd.nextSibling);
      });
    };
    return { share, sub, lateLink };
  }

  _copyMarkdownItem(c) {
    const item = Dom.el('button', null, ChatIcons.copy + 'Copy as Markdown');
    item.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      let msgs = [];
      try {
        const r = await this._ctx.api.conv.messages(c.id);
        msgs = (r && r.success && r.messages) || [];
      } catch (_) {}
      this._copyWithFeedback(item, ConversationMarkdown.build(c, msgs));
    });
    return item;
  }

  _linkItem(c) {
    if (!this._ctx.api.share) return null;
    const item = Dom.el('button', null, ChatIcons.link + 'Link');
    item.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      const url = await this._ctx.share.copyLink('conversation', c.id, c.title);
      item.innerHTML = url ? ChatIcons.check + 'Link copied' : ChatIcons.x + 'Share failed';
      setTimeout(() => this._ctx.popovers.closeAll(), 1100);
    });
    return item;
  }

  _downloadItems(c) {
    const api = this._ctx.api;
    if (!(api.conv && typeof api.conv.export === 'function')) return [];
    return [this._downloadItem(c, 'pdf', 'Download as PDF'), this._downloadItem(c, 'png', 'Download as PNG')];
  }

  _downloadItem(c, kind, label) {
    const idle = ChatIcons.download + label;
    const btn = Dom.el('button', null, idle);
    btn.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      if (btn.disabled) return;
      btn.disabled = true;
      btn.innerHTML = ChatIcons.clock + 'Exporting ' + kind.toUpperCase() + '…';
      let r = null;
      try { r = await this._ctx.api.conv.export(c.id, kind); } catch (err) { r = { success: false, error: err && err.message }; }
      btn.disabled = false;
      if (r && r.canceled) { btn.innerHTML = idle; return; }
      btn.innerHTML = r && r.success ? ChatIcons.check + 'Saved' : ChatIcons.x + 'Export failed';
      setTimeout(() => this._ctx.popovers.closeAll(), r && r.success ? 900 : 1600);
    });
    return btn;
  }

  _wireFlyout(share, sub, menu) {
    const openSub = () => {
      if (!sub.hidden) return;
      sub.hidden = false;
      const r = share.getBoundingClientRect();
      const w = sub.offsetWidth || 190;
      const h = sub.offsetHeight || 160;
      let left = r.right + 2;
      if (left + w > window.innerWidth - 8) left = Math.max(8, r.left - w - 2);
      const top = Math.min(r.top - 5, window.innerHeight - h - 8);
      sub.style.left = left + 'px';
      sub.style.top = Math.max(8, top) + 'px';
      share.classList.add('open');
    };
    const closeSub = () => { sub.hidden = true; share.classList.remove('open'); };
    share.addEventListener('click', (ev) => { ev.stopPropagation(); openSub(); });
    share.addEventListener('mouseenter', openSub);
    menu.addEventListener('mouseover', (ev) => {
      const row = ev.target && ev.target.closest ? ev.target.closest('button') : null;
      if (row && row !== share && !sub.contains(row) && row.parentNode === menu) closeSub();
    });
  }

  _copyWithFeedback(item, text) {
    Clipboard.copyText(text).then((ok) => {
      item.innerHTML = ok ? ChatIcons.check + 'Copied' : ChatIcons.x + 'Copy failed';
      setTimeout(() => this._ctx.popovers.closeAll(), 900);
    });
  }
}
