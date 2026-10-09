import ByteFormatter from '../../format/ByteFormatter.js';

export default class AddonProgress {
  static apply(active, type, payload) {
    const patch = AddonProgress.patchFor(active, type, payload);
    if (patch) Object.assign(active, patch);
  }

  static patchFor(active, type, payload) {
    const inner = (payload && payload.payload) || {};
    if (type === 'runtime') return AddonProgress._runtime(active, payload && payload.type, inner);
    if (type === 'model') return AddonProgress._model(active, payload && payload.type, inner);
    if (type === 'verify') return { phase: 'Verifying checksum…', received: (payload && payload.read) || 0, total: (payload && payload.total) || 0, indeterminate: !(payload && payload.total > 0), label: '' };
    if (type === 'sidecar' || type === 'done') return { phase: 'Registered', indeterminate: false, received: 1, total: 1, label: '' };
    if (type === 'error') return { phase: `Error: ${(payload && payload.message) || 'setup failed'}`, indeterminate: false, received: 0, total: 0 };
    if (type === 'canceled') return { phase: 'Canceled', indeterminate: false, received: 0, total: 0 };
    return null;
  }

  static _runtime(a, t, p) {
    if (t === 'start') return { phase: 'Installing runtime…', indeterminate: true, received: 0, total: 0, label: '' };
    if (t === 'resolved') return { phase: `Runtime: fetching ${p.asset ? p.asset.name : ''}`, indeterminate: true, label: '' };
    if (t === 'download') return { phase: 'Runtime: downloading…', received: p.received || 0, total: p.total || 0, indeterminate: !(p.total > 0) };
    if (t === 'extract') return { phase: p.phase === 'done' ? 'Runtime: verifying…' : 'Runtime: setting up…', indeterminate: true, label: p.label || a.label };
    if (t === 'finalize') return { phase: 'Runtime installed', indeterminate: true, label: '' };
    return null;
  }

  static _model(a, t, p) {
    if (t === 'download') {
      return { phase: 'Downloading model…', received: p.received || 0, total: p.total || 0, indeterminate: !(p.total > 0), label: p.bytesPerSec ? `${ByteFormatter.bytes(p.bytesPerSec)}/s` : a.label };
    }
    if (t === 'resume') return { phase: 'Resuming download…', indeterminate: true };
    if (t === 'verify') return { phase: 'Verifying download…', received: p.read || 0, total: p.total || 0, indeterminate: !(p.total > 0), label: '' };
    if (t === 'finalize') return { phase: 'Download complete', indeterminate: true, label: '' };
    return null;
  }
}
