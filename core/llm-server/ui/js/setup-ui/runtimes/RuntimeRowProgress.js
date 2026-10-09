import ByteFormatter from '../../format/ByteFormatter.js';

export default class RuntimeRowProgress {
  constructor(doc = document) {
    this._doc = doc;
  }

  static cssEscape(value) {
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(String(value));
    return String(value).replace(/[^a-zA-Z0-9_-]/g, (c) => '\\' + c);
  }

  row(id) {
    return this._doc.querySelector(`[data-runtime-row="${RuntimeRowProgress.cssEscape(id)}"]`);
  }

  set(id, opts) {
    const row = this.row(id);
    const parts = row && RuntimeRowProgress._parts(row);
    if (!parts) return;
    if (opts.hide) { parts.wrap.classList.remove('is-active'); return; }
    parts.wrap.classList.add('is-active');
    if (opts.phase) parts.phase.textContent = opts.phase;
    if (opts.indeterminate) RuntimeRowProgress._indeterminate(parts);
    else RuntimeRowProgress._determinate(parts, opts);
  }

  setButtonsDisabled(id, disabled) {
    const row = this.row(id);
    if (!row) return;
    for (const btn of row.querySelectorAll('button[data-runtime-action]')) btn.disabled = disabled;
  }

  applyEvent({ id, type, payload }) {
    const progress = RuntimeRowProgress.progressFor(type, payload);
    if (progress) this.set(id, progress);
  }

  static progressFor(type, payload) {
    if (type === 'start') return { phase: 'Resolving release…', indeterminate: true };
    if (type === 'resolved') {
      const asset = payload && payload.asset;
      return { phase: `Downloading ${asset ? asset.name : ''}`, indeterminate: true };
    }
    if (type === 'download') {
      return { phase: 'Downloading…', received: payload && payload.received, total: payload && payload.total, indeterminate: !(payload && payload.total) };
    }
    if (type === 'extract') return { phase: payload && payload.phase === 'done' ? 'Verifying…' : 'Extracting…', indeterminate: true };
    if (type === 'finalize') return { phase: 'Installed', indeterminate: false, received: 1, total: 1 };
    if (type === 'error') {
      return { phase: `Error: ${(payload && payload.message) || 'install failed'}`, indeterminate: false, received: 0, total: 0 };
    }
    return null;
  }

  static _parts(row) {
    const parts = {
      wrap: row.querySelector('[data-runtime-progress]'),
      phase: row.querySelector('[data-runtime-progress-phase]'),
      bytes: row.querySelector('[data-runtime-progress-bytes]'),
      bar: row.querySelector('[data-runtime-progress-bar]'),
      fill: row.querySelector('[data-runtime-progress-fill]'),
    };
    return parts.wrap && parts.phase && parts.fill ? parts : null;
  }

  static _indeterminate(parts) {
    if (parts.bar) parts.bar.classList.add('indeterminate');
    if (parts.bytes) parts.bytes.textContent = '';
  }

  static _determinate(parts, { received, total }) {
    const fmt = ByteFormatter.bytes;
    if (parts.bar) parts.bar.classList.remove('indeterminate');
    if (total > 0) {
      parts.fill.style.width = `${Math.min(100, (received / total) * 100)}%`;
      if (parts.bytes) parts.bytes.textContent = `${fmt(received)} / ${fmt(total)}`;
    } else {
      parts.fill.style.width = '0%';
      if (parts.bytes) parts.bytes.textContent = received ? fmt(received) : '';
    }
  }
}
