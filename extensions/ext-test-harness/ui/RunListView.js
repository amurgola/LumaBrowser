import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import HarnessText from './HarnessText.js';
import RunDetailView from './RunDetailView.js';

export default class RunListView {
  static EMPTY_HTML = '<div class="th-empty">No test runs yet</div>';

  static render(runs, expanded) {
    if (!runs.length) return RunListView.EMPTY_HTML;
    return runs.map((run) => RunListView._row(run, expanded)).join('');
  }

  static _row(run, expanded) {
    const esc = HtmlEscaper.escape;
    const open = expanded && expanded.runId === run.id && expanded.detail;
    return `
          <div class="th-run-item" data-run-id="${esc(run.id)}">
            <div class="th-run-header">
              <span class="th-run-status ${esc(run.status)}">${esc(run.status)}</span>
              <span class="th-run-test-name">${esc(run.test_id)}</span>
              ${run.variant_id ? `<span class="th-run-variant">${esc(run.variant_id)}</span>` : ''}
              <span class="th-run-time">${esc(HarnessText.formatTime(run.started_at))}</span>
              <span class="th-run-duration">${HarnessText.formatDuration(run.duration_ms)}</span>
            </div>
            <div class="th-run-summary">
              ${esc(run.summary || '')}
              ${RunListView._counts(run)}
            </div>
            ${open ? RunDetailView.render(run, expanded.detail) : ''}
          </div>
        `;
  }

  static _counts(run) {
    const assertions = HarnessText.parseJson(run.assertions) || [];
    if (!assertions.length) return '';
    const pass = assertions.filter((a) => a.passed).length;
    return ` | ${pass} pass, ${assertions.length - pass} fail`;
  }
}
