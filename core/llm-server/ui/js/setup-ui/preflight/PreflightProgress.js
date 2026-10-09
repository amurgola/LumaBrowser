import ByteFormatter from '../../format/ByteFormatter.js';

export default class PreflightProgress {
  static set(row, opts) {
    const parts = PreflightProgress._parts(row);
    if (!parts) return;
    if (opts.hide) { parts.wrap.hidden = true; return; }
    parts.wrap.hidden = false;
    if (opts.phase) parts.phase.textContent = opts.phase;
    if (opts.indeterminate) PreflightProgress._indeterminate(parts);
    else PreflightProgress._determinate(parts, opts);
  }

  static _parts(row) {
    const parts = {
      wrap: row.querySelector('.preflight-progress'),
      phase: row.querySelector('[data-pf-phase]'),
      bytes: row.querySelector('[data-pf-bytes]'),
      bar: row.querySelector('[data-pf-bar]'),
      fill: row.querySelector('[data-pf-fill]'),
    };
    return parts.wrap && parts.phase && parts.fill ? parts : null;
  }

  static _indeterminate(parts) {
    if (parts.bar) parts.bar.classList.add('indeterminate');
    if (parts.bytes) parts.bytes.textContent = '';
  }

  static _determinate(parts, { received, total }) {
    if (parts.bar) parts.bar.classList.remove('indeterminate');
    if (!(total > 0)) return;
    parts.fill.style.width = `${Math.min(100, (received / total) * 100)}%`;
    if (parts.bytes) parts.bytes.textContent = `${ByteFormatter.bytes(received)} / ${ByteFormatter.bytes(total)}`;
  }
}
