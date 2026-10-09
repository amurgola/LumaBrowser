import ChatIcons from '../ChatIcons.js';
import DashboardContext from './DashboardContext.js';
import DocsSourceContext from './DocsSourceContext.js';
import TabContext from './TabContext.js';
import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class ComposerCommands {
  static SLASH_RE = /^\/([\w-]*)$/;

  static MENTION_RE = /(^|\s)@([^\s@]*)$/;

  static MAX_ITEMS = 8;

  static TABS_TTL_MS = 3000;

  static COMMANDS = [
    { name: 'summarize', hint: 'Summarize the page you were on', fill: 'Summarize this in a few short bullet points.', page: true, icon: 'doc' },
    { name: 'explain', hint: 'Explain the page you were on simply', fill: 'Explain this in plain language, as if I am new to the topic.', page: true, icon: 'doc' },
    { name: 'translate', hint: 'Translate text into another language', fill: 'Translate this into ', icon: 'globe' },
    { name: 'tab', hint: 'Ask about an open tab', action: 'tab', needsTabs: true, icon: 'globe' },
    { name: 'dashboard', hint: 'Ask about your Dashboard widgets', action: 'dashboard', needsDashboard: true, icon: 'grid' },
    { name: 'attach', hint: 'Attach a file', action: 'attach', needsPicker: true, icon: 'paperclip' },
    { name: 'model', hint: 'Model and chat options', action: 'model', icon: 'gear' },
    { name: 'new', hint: 'Start a new chat', action: 'new', icon: 'plus' },
  ];

  constructor(ctx) {
    this._ctx = ctx;
    this._menu = null;
    this._seq = 0;
    this._tabs = { at: 0, list: [] };
  }

  wire(ta) {
    if (!ta) return;
    ta.addEventListener('input', () => this.update(ta));
    ta.addEventListener('click', () => this.update(ta));
    ta.addEventListener('blur', () => setTimeout(() => { if (this._menu && this._menu.ta === ta) this.close(); }, 150));
  }

  onKey(e, ta) {
    const m = this._menu;
    if (!m || m.ta !== ta || !m.items.length) return false;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      this._select((m.index + (e.key === 'ArrowDown' ? 1 : -1) + m.items.length) % m.items.length);
      return true;
    }
    if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Tab') {
      e.preventDefault();
      this._pick(m.items[m.index]);
      return true;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this.close();
      return true;
    }
    return false;
  }

  async update(ta) {
    const before = ta.value.slice(0, ta.selectionStart == null ? ta.value.length : ta.selectionStart);
    const slash = ComposerCommands.SLASH_RE.exec(before);
    const mention = slash ? null : ComposerCommands.MENTION_RE.exec(before);
    if (!slash && !mention) { this.close(); return; }
    const seq = ++this._seq;
    const trigger = slash
      ? { kind: 'slash', query: slash[1].toLowerCase(), start: 0, end: before.length }
      : { kind: 'mention', query: mention[2].toLowerCase(), start: before.length - mention[2].length - 1, end: before.length };
    const items = trigger.kind === 'slash' ? this._commandItems(trigger.query) : await this._mentionItems(trigger.query);
    if (seq !== this._seq) return;
    if (!items.length) { this.close(); return; }
    this._show(ta, trigger, items);
  }

  close() {
    if (this._menu && this._menu.pop) this._menu.pop.remove();
    this._menu = null;
  }

  isOpen() {
    return !!this._menu;
  }

  _commandItems(q) {
    const { api } = this._ctx;
    return ComposerCommands.COMMANDS
      .filter((c) => !c.needsTabs || this._ctx.tabs.available())
      .filter((c) => !c.needsDashboard || this._ctx.dashboard.available())
      .filter((c) => !c.needsPicker || !!api.pickChatAttachment)
      .filter((c) => c.name.startsWith(q))
      .map((c) => ({ kind: 'command', command: c, label: '/' + c.name, hint: c.hint, icon: ChatIcons[c.icon] || '' }));
  }

  async _mentionItems(q) {
    const tail = [];
    if (this._ctx.dashboard.available() && DashboardContext.matches(q)) {
      tail.push({ kind: 'dashboard', label: DashboardContext.NAME, hint: DashboardContext.HINT, icon: DashboardContext.iconHtml() });
    }
    if (this._ctx.docs.available() && !this._ctx.docs.on() && DocsSourceContext.matches(q)) {
      tail.push({ kind: 'docs', label: DocsSourceContext.NAME, hint: DocsSourceContext.HINT, icon: DocsSourceContext.iconHtml() });
    }
    if (this._ctx.api.pickChatAttachment && (!q || 'file'.startsWith(q) || 'attach'.startsWith(q))) {
      tail.push({ kind: 'file', label: 'Attach a file…', hint: 'Text, code, PDF or image', icon: ChatIcons.paperclip });
    }
    const items = [];
    const tabs = await this._recentTabs();
    for (const t of tabs) {
      if (items.length >= ComposerCommands.MAX_ITEMS - tail.length) break;
      const title = String(t.title || '');
      const host = TabContext.host(t.url);
      if (q && !title.toLowerCase().includes(q) && !host.toLowerCase().includes(q)) continue;
      items.push({ kind: 'tab', tab: t, label: title || host, hint: host, icon: TabContext.iconHtml(t.favicon) });
    }
    return items.concat(tail);
  }

  async _recentTabs() {
    if (Date.now() - this._tabs.at > ComposerCommands.TABS_TTL_MS) this._tabs = { at: Date.now(), list: await this._ctx.tabs.list() };
    return this._tabs.list;
  }

  _show(ta, trigger, items) {
    const composer = ta.closest('.cm-composer');
    if (!composer) return;
    let pop = this._menu && this._menu.ta === ta ? this._menu.pop : null;
    if (!pop) {
      this.close();
      pop = Dom.el('div', 'cm-cmd-pop');
      pop.setAttribute('role', 'listbox');
      pop.addEventListener('mousedown', (e) => {
        const row = e.target.closest('[data-cmd-i]');
        if (!row || !this._menu) return;
        e.preventDefault();
        this._pick(this._menu.items[Number(row.dataset.cmdI)]);
      });
      composer.appendChild(pop);
    }
    const esc = HtmlEscaper.escape;
    pop.innerHTML = items.slice(0, ComposerCommands.MAX_ITEMS).map((it, i) => '<div class="cm-cmd-row" role="option" data-cmd-i="' + i + '">'
      + '<span class="cm-cmd-ic">' + it.icon + '</span>'
      + '<span class="cm-cmd-label">' + esc(it.label) + '</span>'
      + '<span class="cm-cmd-hint">' + esc(it.hint || '') + '</span></div>').join('');
    this._menu = { ta, pop, trigger, items: items.slice(0, ComposerCommands.MAX_ITEMS), index: 0 };
    this._select(0);
  }

  _select(i) {
    const m = this._menu;
    if (!m) return;
    m.index = i;
    m.pop.querySelectorAll('.cm-cmd-row').forEach((row, j) => {
      row.classList.toggle('on', j === i);
      row.setAttribute('aria-selected', j === i ? 'true' : 'false');
    });
  }

  _pick(item) {
    const m = this._menu;
    if (!m || !item) return;
    const { ta, trigger } = m;
    this.close();
    const rest = ta.value.slice(0, trigger.start) + ta.value.slice(trigger.end);
    if (item.kind === 'command' && item.command.fill) {
      this._setText(ta, item.command.fill + rest.replace(/^\s+/, ''), item.command.fill.length);
      if (item.command.page) this._attachRecentPage();
      return;
    }
    this._setText(ta, rest, trigger.start);
    if (item.kind === 'tab') this._ctx.tabs.attach(item.tab, null);
    else if (item.kind === 'dashboard') this._ctx.dashboard.attach();
    else if (item.kind === 'docs') this._ctx.docs.enable();
    else if (item.kind === 'file') this._pickFile();
    else this._runAction(item.command.action, ta);
  }

  _runAction(action, ta) {
    const ctx = this._ctx;
    if (action === 'tab') {
      const btn = ta.closest('.cm-composer').querySelector('.cm-tabs-btn');
      if (btn) ctx.tabs.open(btn);
    } else if (action === 'dashboard') {
      ctx.dashboard.attach();
    } else if (action === 'attach') {
      this._pickFile();
    } else if (action === 'model') {
      const gear = ta.closest('.cm-composer').querySelector('.cm-gear');
      if (gear) ctx.gear.open(gear);
    } else if (action === 'new') {
      ctx.conversation.newChat();
    }
  }

  async _pickFile() {
    try {
      const r = await this._ctx.api.pickChatAttachment();
      if (r && r.success && Array.isArray(r.files) && r.files.length) this._ctx.attachments.add(r.files);
    } catch (_) {}
    this._ctx.composer.focus();
  }

  async _attachRecentPage() {
    const { state } = this._ctx;
    if (state.attachments.length || !this._ctx.tabs.available()) return;
    const tab = state.tabSuggestion || (await this._ctx.tabs.list())[0];
    if (tab) this._ctx.tabs.attach(tab, null);
  }

  _setText(ta, text, caret) {
    ta.value = text;
    ta.focus();
    ta.setSelectionRange(caret, caret);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
