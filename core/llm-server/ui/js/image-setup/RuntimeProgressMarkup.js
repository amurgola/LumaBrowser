import ByteFormatter from '../format/ByteFormatter.js';
import HtmlEscaper from '../format/HtmlEscaper.js';
import ProgressPercent from './ProgressPercent.js';

export default class RuntimeProgressMarkup {
  static IDLE = `<div class="runtime-progress" data-runtime-progress>
        <div class="runtime-progress-label"><span>Idle</span><span></span></div>
        <div class="luma-progress"><div class="luma-progress-fill" style="width:0%"></div></div>
      </div>`;

  static html(p) {
    if (!p) return RuntimeProgressMarkup.IDLE;
    if (p.phase === 'failed') return RuntimeProgressMarkup._failed(p.error);
    const pct = ProgressPercent.of(p.received, p.total);
    const bytes = pct != null ? `${ByteFormatter.bytes(p.received)} / ${ByteFormatter.bytes(p.total)}` : '';
    const indeterminate = pct == null ? ' indeterminate' : '';
    return `
      <div class="runtime-progress is-active" data-runtime-progress>
        <div class="runtime-progress-label"><span>${HtmlEscaper.escape(RuntimeProgressMarkup.label(p.phase, pct))}</span><span>${bytes}</span></div>
        <div class="luma-progress${indeterminate}"><div class="luma-progress-fill" style="width:${pct == null ? 40 : pct}%"></div></div>
      </div>`;
  }

  static label(phase, pct) {
    const suffix = pct == null ? '' : ' ' + pct + '%';
    if (phase === 'starting') return 'Starting…';
    if (phase === 'resolved') return 'Resolved';
    if (phase === 'download') return 'Downloading' + suffix;
    if (phase === 'companion') return 'Companion' + suffix;
    if (phase === 'extracting') return 'Extracting…';
    if (phase === 'extracted') return 'Extracted';
    return '…';
  }

  static _failed(error) {
    return `
      <div class="runtime-progress is-active" data-runtime-progress>
        <div class="runtime-progress-label"><span class="fit-note bad">Failed: ${HtmlEscaper.escape(error || 'unknown')}</span><span></span></div>
        <div class="luma-progress"><div class="luma-progress-fill" style="width:0%"></div></div>
      </div>`;
  }
}
