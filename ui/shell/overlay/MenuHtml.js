import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class MenuHtml {
  static STYLE = '<style>'
    + '.bd-context-menu button { justify-content: flex-start; }'
    + '.bd-context-menu button[disabled] { opacity: 0.45; cursor: default; }'
    + '.bd-context-menu button[disabled]:hover { background: transparent; }'
    + '.bd-menu-hint { flex: none; margin-left: auto; padding-left: var(--space-4); font-size: var(--text-xs); color: var(--text-muted); }'
    + '.bd-menu-check { margin-left: auto; padding-left: var(--space-4); font-size: var(--text-xs); color: var(--text-muted); }'
    + '.bd-dl-menu { padding: var(--space-2); }'
    + '.bd-dl-title { font-size: var(--text-sm); font-weight: var(--weight-semibold); color: var(--text-primary); padding: 2px 6px var(--space-2); }'
    + '.bd-dl-row { display: flex; align-items: center; gap: var(--space-3); padding: 6px; border-radius: var(--radius-md); }'
    + '.bd-dl-row:hover { background: var(--bg-elevated); }'
    + '.bd-dl-main { display: flex; flex-direction: column; min-width: 0; flex: 1; gap: var(--space-1); }'
    + '.bd-dl-name { color: var(--text-primary); font-size: var(--text-md); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }'
    + '.bd-dl-status { color: var(--text-muted); font-size: var(--text-xs); }'
    + '.bd-dl-row.failed .bd-dl-status { color: var(--danger); }'
    + '.bd-dl-bar { display: block; height: 3px; border-radius: 2px; background: var(--border-strong); overflow: hidden; }'
    + '.bd-dl-fill { display: block; height: 100%; background: var(--accent); transition: width var(--dur) var(--ease); }'
    + '.bd-dl-bar.indeterminate .bd-dl-fill { width: 40% !important; animation: bd-dl-slide 1.2s linear infinite; }'
    + '@keyframes bd-dl-slide { from { transform: translateX(-100%); } to { transform: translateX(250%); } }'
    + '.bd-dl-actions { display: flex; gap: var(--space-1); flex: none; }'
    + '.bd-context-menu button.bd-dl-act { width: auto; height: 24px; padding: 0 var(--space-2); font-size: var(--text-xs); background: var(--bg-surface-2); border-radius: var(--radius-md); color: var(--text-secondary); }'
    + '.bd-context-menu button.bd-dl-act:hover { background: var(--bg-elevated); color: var(--text-primary); }'
    + '</style>';

  static render(items) {
    const actions = [];
    const html = items.map((it) => {
      if (it.sep) return '<div class="bd-menu-sep"></div>';
      const idx = actions.length;
      actions.push(it.action);
      return MenuHtml._button(it, idx);
    }).join('');
    return { html, actions };
  }

  static _button(it, idx) {
    const esc = HtmlEscaper.escape;
    const cls = [it.danger ? 'bd-danger' : '', it.check ? 'is-checked' : ''].filter(Boolean).join(' ');
    const hint = it.hint ? `<span class="bd-menu-hint">${esc(it.hint)}</span>` : '';
    const check = it.check ? `<span class="bd-menu-check">${esc(it.checkLabel || 'On')}</span>` : '';
    return `<button data-bd-action="${esc(it.action)}" data-bd-index="${idx}"${cls ? ` class="${cls}"` : ''}${it.disabled ? ' disabled' : ''}>`
      + `${it.icon || ''}<span class="bd-menu-label">${esc(it.label)}</span>${hint}${check}</button>`;
  }
}
