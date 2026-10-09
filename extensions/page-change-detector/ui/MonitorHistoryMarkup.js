import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import TimeText from '../../ui-kit/ui/TimeText.js';

export default class MonitorHistoryMarkup {
  static diffSummary(diff) {
    const esc = HtmlEscaper.escape;
    if (!diff) return '';
    const lines = String(diff).split('\n');
    const stats = lines[0] || '';
    const snippet = lines.slice(1).map((line) => {
      if (line.startsWith('+ ')) return `<div class="pcd-diff-line pcd-diff-add">${esc(line)}</div>`;
      if (line.startsWith('- ')) return `<div class="pcd-diff-line pcd-diff-remove">${esc(line)}</div>`;
      return `<div class="pcd-diff-line">${esc(line)}</div>`;
    }).join('');
    return `<div class="pcd-history-diff">${stats ? `<div class="pcd-diff-stats">${esc(stats)}</div>` : ''}${snippet}</div>`;
  }

  static changedEntry(h) {
    const esc = HtmlEscaper.escape;
    return `
        <div class="pcd-history-entry">
          <div class="pcd-history-row">
            <span class="luma-dot ok"></span>
            <span class="pcd-history-status">Changed</span>
            <span class="pcd-history-time">${esc(TimeText.formatTime(h.checked_at))}</span>
            <span class="pcd-history-len">${esc(String(h.text_length))} chars</span>
          </div>
          ${MonitorHistoryMarkup.diffSummary(h.diff_summary)}
        </div>`;
  }

  static noChangeRun(run) {
    const esc = HtmlEscaper.escape;
    const range = run.count > 1
      ? `${TimeText.formatTime(run.lastTime)} to ${TimeText.formatTime(run.firstTime)}`
      : TimeText.formatTime(run.firstTime);
    return `
        <div class="pcd-history-entry pcd-history-entry--quiet">
          <div class="pcd-history-row">
            <span class="luma-dot"></span>
            <span class="pcd-history-status">No change${run.count > 1 ? ` (${run.count} checks)` : ''}</span>
            <span class="pcd-history-time">${esc(range)}</span>
          </div>
        </div>`;
  }

  static collapseNoChangeRuns(items) {
    const out = [];
    let run = null;
    for (const item of items) {
      if (item.changed) {
        if (run) { out.push(run); run = null; }
        out.push(item);
      } else if (run) {
        run.count++;
        run.lastTime = item.checked_at;
      } else {
        run = { isRun: true, count: 1, firstTime: item.checked_at, lastTime: item.checked_at };
      }
    }
    if (run) out.push(run);
    return out;
  }

  static recentList(history) {
    const total = history.length;
    const changes = history.filter((h) => h.changed);
    const summary = `<div class="pcd-history-summary"><strong>${changes.length}</strong> change${changes.length !== 1 ? 's' : ''} in the last <strong>${total}</strong> check${total !== 1 ? 's' : ''}</div>`;
    if (changes.length === 0) return summary + '<div class="luma-muted">No changes recorded yet.</div>';
    return summary + changes.map((h) => MonitorHistoryMarkup.changedEntry(h)).join('');
  }

  static pageItems(items, changedOnly) {
    const shown = changedOnly ? items : MonitorHistoryMarkup.collapseNoChangeRuns(items);
    return shown.map((item) => (item.isRun ? MonitorHistoryMarkup.noChangeRun(item) : MonitorHistoryMarkup.changedEntry(item))).join('');
  }

  static pager(page, totalPages) {
    return `
        <button class="luma-btn luma-btn--sm pcd-pager-prev" ${page === 0 ? 'disabled' : ''}>Newer</button>
        <span class="luma-muted">Page ${page + 1} of ${totalPages}</span>
        <button class="luma-btn luma-btn--sm pcd-pager-next" ${page >= totalPages - 1 ? 'disabled' : ''}>Older</button>`;
  }

  static monitorOptions(monitors) {
    const esc = HtmlEscaper.escape;
    return monitors.length
      ? monitors.map((m) => `<option value="${esc(m.id)}">${esc(m.name)}</option>`).join('')
      : '<option value="">No monitors yet</option>';
  }
}
