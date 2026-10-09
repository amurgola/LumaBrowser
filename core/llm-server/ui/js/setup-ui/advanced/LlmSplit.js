import RemoteRefs from './RemoteRefs.js';

export default class LlmSplit {
  static GIB = 1024 * 1024 * 1024;

  static MIN_OVERFLOW_BYTES = 0.1 * LlmSplit.GIB;

  static NEED_TARGET = 'Pick where the overflow goes (a GPU or System RAM).';

  static APPLIED = 'Split set. Save the layout to apply it.';

  static open(model, fit) {
    const total = fit.itemBytes('llm');
    if (total == null) return null;
    const r = model.resource(model.effectiveResourceId('llm'));
    if (!r || r.kind === 'ram' || !r.devices.length) return null;
    const primaryCard = r.devices[0];
    if (RemoteRefs.resourceHasRemote(r)) return null;
    return { totalBytes: total, primaryCard, ...LlmSplit._current(model.layout.items.llm || {}, r, total) };
  }

  static apply(model, editor) {
    if (!editor.target) return LlmSplit.NEED_TARGET;
    const total = editor.totalBytes;
    const primary = Math.max(0, Math.min(total, editor.boundaryBytes));
    const overflow = total - primary;
    model.detachLlmFromSingularities();
    model.layout.items.llm = LlmSplit._entry(model, editor, primary, overflow);
    return null;
  }

  static clampBoundary(totalBytes, megabytes) {
    return Math.max(0, Math.min(totalBytes, Number(megabytes) * 1e6));
  }

  static round1(x) {
    return Math.max(0.1, Math.round(x * 10) / 10);
  }

  static _current(entry, resource, total) {
    if (Array.isArray(entry.split) && resource.devices.length >= 2) {
      const sum = entry.split.reduce((a, b) => a + b, 0) || 1;
      return { boundaryBytes: total * (entry.split[0] / sum), target: { kind: 'gpu', idx: resource.devices[1] } };
    }
    if (Number(entry.vramCapBytes) > 0) {
      return { boundaryBytes: Math.min(total, Number(entry.vramCapBytes)), target: { kind: 'ram' } };
    }
    return { boundaryBytes: total, target: null };
  }

  static _entry(model, editor, primary, overflow) {
    if (overflow < LlmSplit.MIN_OVERFLOW_BYTES) return { resource: 'g' + editor.primaryCard, split: null };
    if (editor.target.kind === 'gpu') {
      const id = model.ensureGroup([editor.primaryCard, editor.target.idx]);
      return { resource: id, split: [LlmSplit.round1(primary / LlmSplit.GIB), LlmSplit.round1(overflow / LlmSplit.GIB)] };
    }
    return { resource: 'g' + editor.primaryCard, split: null, vramCapBytes: Math.round(primary) };
  }
}
