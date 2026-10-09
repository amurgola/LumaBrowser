import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class MenuHtml {
  static STYLE = '<style>'
    + '.bd-context-menu button { justify-content: flex-start; }'
    + '.bd-context-menu button[disabled] { opacity: 0.45; cursor: default; }'
    + '.bd-context-menu button[disabled]:hover { background: transparent; }'
    + '.bd-menu-hint { margin-left: auto; padding-left: 16px; font-size: 11px; color: var(--text-dim); }'
    + '.bd-menu-check { margin-left: auto; padding-left: 16px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: var(--accent); }'
    + '.bd-dl-menu { padding: 8px; }'
    + '.bd-dl-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: var(--text-dim); padding: 2px 6px 8px; }'
    + '.bd-dl-row { display: flex; align-items: center; gap: 10px; padding: 6px; border-radius: var(--radius-sm); }'
    + '.bd-dl-row:hover { background: var(--bg-card); }'
    + '.bd-dl-main { display: flex; flex-direction: column; min-width: 0; flex: 1; gap: 3px; }'
    + '.bd-dl-name { color: var(--text); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }'
    + '.bd-dl-status { color: var(--text-dim); font-size: 11px; }'
    + '.bd-dl-row.failed .bd-dl-status { color: var(--bad); }'
    + '.bd-dl-row.done .bd-dl-status { color: var(--good); }'
    + '.bd-dl-bar { display: block; height: 3px; border-radius: 2px; background: var(--border-strong); overflow: hidden; }'
    + '.bd-dl-fill { display: block; height: 100%; background: var(--accent); transition: width 0.2s; }'
    + '.bd-dl-bar.indeterminate .bd-dl-fill { width: 40% !important; animation: bd-dl-slide 1.2s linear infinite; }'
    + '@keyframes bd-dl-slide { from { transform: translateX(-100%); } to { transform: translateX(250%); } }'
    + '.bd-dl-actions { display: flex; gap: 4px; flex: none; }'
    + '.bd-dl-act { width: auto; padding: 4px 8px; font-size: 11px; border: 1px solid var(--border-strong) !important; border-radius: var(--radius-sm); color: var(--text-dim); }'
    + '.bd-dl-act:hover { color: var(--text); border-color: var(--accent) !important; }'
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
      + `${it.icon || ''}${esc(it.label)}${hint}${check}</button>`;
  }
}
