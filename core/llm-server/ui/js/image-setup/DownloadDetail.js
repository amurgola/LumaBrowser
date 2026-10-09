import ByteFormatter from '../format/ByteFormatter.js';
import HtmlEscaper from '../format/HtmlEscaper.js';
import ProgressPercent from './ProgressPercent.js';

export default class DownloadDetail {
  static html(dl) {
    const esc = HtmlEscaper.escape;
    const pct = ProgressPercent.of(dl.received, dl.total);
    const filesLine = dl.totalFiles
      ? `File ${(dl.index || 0) + 1} of ${dl.totalFiles}${dl.role ? ' · ' + esc(dl.role) : ''}`
      : (dl.role || '');
    const bytes = pct == null
      ? 'starting…'
      : pct + '% · ' + ByteFormatter.bytes(dl.received) + (dl.total ? ' of ' + ByteFormatter.bytes(dl.total) : '');
    return `
      <div class="fit-progress">
        <span>${esc(filesLine)}</span>
        <div class="luma-progress"><div class="luma-progress-fill" style="width:${pct == null ? 30 : pct}%"></div></div>
        <span class="fit-note">${bytes}</span>
      </div>`;
  }
}
