import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import MenuHtml from '../overlay/MenuHtml.js';
import DownloadText from './DownloadText.js';

export default class DownloadsMenuHtml {
  static render(list) {
    const sorted = [...list].sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));
    if (!sorted.length) return `${MenuHtml.STYLE}<div class="bd-context-menu"><div class="bd-folder-menu-empty">No downloads yet</div></div>`;
    const rows = sorted.map((d) => DownloadsMenuHtml._row(d)).join('');
    return `${MenuHtml.STYLE}<div class="bd-context-menu bd-dl-menu"><div class="bd-dl-title">Downloads</div>${rows}</div>`;
  }

  static _row(d) {
    const esc = HtmlEscaper.escape;
    return `<div class="bd-dl-row ${esc(d.state)}">`
      + `<span class="bd-dl-main"><span class="bd-dl-name" title="${esc(d.savePath || d.url || '')}">${esc(d.filename || 'Download')}</span>`
      + `<span class="bd-dl-status">${esc(DownloadText.status(d))}</span>${DownloadsMenuHtml._bar(d)}</span>`
      + `<span class="bd-dl-actions">${DownloadsMenuHtml._actions(d)}</span></div>`;
  }

  static _bar(d) {
    if (d.state !== 'progress') return '';
    return `<span class="bd-dl-bar${d.total ? '' : ' indeterminate'}"><span class="bd-dl-fill" style="width:${DownloadText.percent(d)}%"></span></span>`;
  }

  static _actions(d) {
    const id = HtmlEscaper.escape(d.id);
    if (d.state === 'progress') return `<button data-bd-action="cancel" data-bd-id="${id}" class="bd-dl-act" title="Cancel">Cancel</button>`;
    if (d.state !== 'done') return '';
    return `<button data-bd-action="open" data-bd-id="${id}" class="bd-dl-act" title="Open">Open</button>`
      + `<button data-bd-action="folder" data-bd-id="${id}" class="bd-dl-act" title="Show in folder">Folder</button>`;
  }
}
