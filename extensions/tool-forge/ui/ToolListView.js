import Dom from '../../../core/llm-server/ui/js/dom/Dom.js';
import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import ToolNotice from './ToolNotice.js';

export default class ToolListView {
  static render(el, view, on) {
    el.appendChild(ToolListView._head(on));
    if (!view.encryptionAvailable) {
      el.appendChild(Dom.el('div', 'luma-callout warn',
        'Secure key storage is unavailable on this system, so secret values are stored unencrypted. Avoid high-value credentials.'));
    }
    ToolNotice.render(el, view.notice, on.dismiss);
    if (!view.tools.length) {
      el.appendChild(Dom.el('div', 'luma-empty',
        'No tools yet. In a chat, ask the AI to build one, for example: '
        + '"make a tool that looks up a GitHub repo\'s star count".'));
      return;
    }
    const list = Dom.el('div', 'luma-list');
    for (const tool of view.tools) list.appendChild(ToolListView._card(tool, on));
    el.appendChild(list);
  }

  static _head(on) {
    const head = Dom.el('div', 'luma-head');
    head.appendChild(Dom.el('div', null,
      '<div class="luma-title">My Tools</div>'
      + '<div class="luma-sub">Tools the AI built for you. Ask in chat to create a new one; '
      + 'published tools are enabled right away; the chat gear panel toggles them per chat.</div>'));
    const actions = Dom.el('div', 'tf-head-actions');
    const imp = Dom.el('button', 'luma-btn', 'Import tool…');
    imp.addEventListener('click', on.importTool);
    actions.appendChild(imp);
    head.appendChild(actions);
    return head;
  }

  static _card(t, on) {
    const card = Dom.el('div', 'luma-card luma-card--center');
    const main = Dom.el('div', 'luma-card-main');
    main.appendChild(Dom.el('div', 'luma-card-name', HtmlEscaper.escape(t.label || t.name) + ' ' + ToolListView.statusChip(t.status)));
    if (t.description) main.appendChild(Dom.el('div', 'luma-card-desc', HtmlEscaper.escape(t.description)));
    main.appendChild(ToolListView._meta(t));
    card.appendChild(main);
    card.appendChild(ToolListView._actions(t, on));
    return card;
  }

  static statusChip(status) {
    return '<span class="luma-chip tf-status-' + HtmlEscaper.escape(status) + '">' + HtmlEscaper.escape(status) + '</span>';
  }

  static _meta(t) {
    const meta = Dom.el('div', 'tf-card-meta');
    const hosts = (t.allowedHosts && t.allowedHosts.length) ? t.allowedHosts.join(', ') : 'no network';
    meta.appendChild(Dom.el('span', 'luma-chip', 'net: ' + HtmlEscaper.escape(hosts)));
    if (t.config && t.config.missingRequired && t.config.missingRequired.length) {
      meta.appendChild(Dom.el('span', 'luma-chip tf-warn', 'needs config'));
    }
    return meta;
  }

  static _actions(t, on) {
    const acts = Dom.el('div', 'luma-card-actions');
    for (const [label, cls, fn] of [['Edit', 'luma-btn', on.edit], ['Export', 'luma-btn', on.exportTool], ['Delete', 'luma-btn danger', on.deleteTool]]) {
      const btn = Dom.el('button', cls, label);
      btn.addEventListener('click', () => fn(t.name));
      acts.appendChild(btn);
    }
    return acts;
  }
}
