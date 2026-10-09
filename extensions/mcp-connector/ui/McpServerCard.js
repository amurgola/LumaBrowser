import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class McpServerCard {
  static STATUS_LABEL = {
    connected: 'Connected', connecting: 'Connecting…', error: 'Error', disabled: 'Disabled', idle: 'Not connected',
  };

  static STATUS_BADGE = { connected: 'ok', connecting: 'warn', error: 'bad', disabled: 'muted', idle: 'muted' };

  static render(s, on) {
    const card = document.createElement('div');
    card.className = 'luma-card';
    card.appendChild(McpServerCard._main(s));
    card.appendChild(McpServerCard._actions(s, on));
    return card;
  }

  static target(s) {
    return s.transport === 'stdio' ? (s.command + (s.args && s.args.length ? ' ' + s.args.join(' ') : '')) : s.url;
  }

  static _main(s) {
    const esc = HtmlEscaper.escape;
    const main = document.createElement('div');
    main.className = 'luma-card-main';
    main.innerHTML =
      '<div class="luma-card-top">'
      + '<span class="luma-card-name">' + esc(s.name) + '</span>'
      + '<span class="luma-badge ' + (McpServerCard.STATUS_BADGE[s.status] || 'muted') + '">' + esc(McpServerCard.STATUS_LABEL[s.status] || s.status) + '</span>'
      + '<span class="luma-chip">' + esc(s.transport) + '</span>'
      + (s.status === 'connected' ? '<span class="luma-chip">' + (s.tools || []).length + ' tool(s)</span>' : '')
      + '</div>'
      + '<div class="mcpc-target">' + esc(McpServerCard.target(s) || '') + '</div>'
      + (s.error ? '<div class="mcpc-err-line">' + esc(s.error) + '</div>' : '')
      + McpServerCard._toolChips(s);
    return main;
  }

  static _toolChips(s) {
    if ((s.tools || []).length) {
      return '<div class="mcpc-tools">' + s.tools.map((t) =>
        '<span class="mcpc-tool" title="' + HtmlEscaper.escape(t.description || '') + '">' + HtmlEscaper.escape(t.name) + '</span>').join('') + '</div>';
    }
    return s.status === 'connected' ? '<div class="luma-muted">No tools exposed.</div>' : '';
  }

  static _actions(s, on) {
    const actions = document.createElement('div');
    actions.className = 'luma-card-actions luma-card-actions--stack';
    actions.appendChild(McpServerCard._button('luma-btn', s.enabled ? 'Disable' : 'Enable', () => on.toggle(s.id, !s.enabled)));
    const reconnect = McpServerCard._button('luma-btn', 'Reconnect', () => on.reconnect(s.id));
    reconnect.disabled = !s.enabled;
    actions.appendChild(reconnect);
    actions.appendChild(McpServerCard._button('luma-btn', 'Edit', () => on.edit(s)));
    actions.appendChild(McpServerCard._button('luma-btn danger', 'Remove', () => on.remove(s.id, s.name)));
    return actions;
  }

  static _button(cls, label, onClick) {
    const btn = document.createElement('button');
    btn.className = cls;
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
  }
}
