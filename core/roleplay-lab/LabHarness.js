const fs = require('fs');
const path = require('path');
const LabStepParams = require('./LabStepParams');
const LabCompletionKind = require('./LabCompletionKind');

class LabHarness {
  static GLOBAL_KEY = '__rpLab';
  static DEFAULT_LABEL = 'image';
  static DEFAULT_MIME = 'image/png';

  constructor({ outDir = null, emit = null, overrides = {}, frozen = {}, completeMocks = {} } = {}) {
    this.active = true;
    this.outDir = outDir;
    this.steps = [];
    this.fullOpts = {};
    this._emit = typeof emit === 'function' ? emit : () => {};
    this._overrides = overrides || {};
    this._frozen = frozen || {};
    this._completeMocks = completeMocks || {};
    this._seq = 0;
    this._labelCounts = {};
    this._pendingKey = null;
    this._pendingOpts = null;
    this._ensureOutDir();
  }

  static install(harness) {
    global[LabHarness.GLOBAL_KEY] = harness;
    return harness;
  }

  static uninstall() {
    const harness = global[LabHarness.GLOBAL_KEY];
    global[LabHarness.GLOBAL_KEY] = null;
    return harness;
  }

  static current() {
    return global[LabHarness.GLOBAL_KEY] || null;
  }

  beforeImage(opts = {}) {
    const label = opts.label || LabHarness.DEFAULT_LABEL;
    const key = this._stepKey(label);
    const frozen = this._frozen[key];
    if (frozen && frozen.b64) return this._replayFrozen(key, label, opts, frozen);
    const merged = this._overrides[key] ? { ...opts, ...this._overrides[key] } : opts;
    this._pendingKey = key;
    this._pendingOpts = merged;
    this.fullOpts[key] = merged;
    return { opts: merged };
  }

  afterImage(result, effective) {
    if (!this._pendingKey) return;
    const opts = this._pendingOpts || {};
    this._record(this._pendingKey, opts.label || LabHarness.DEFAULT_LABEL, opts, result, false, effective);
    this._pendingKey = null;
    this._pendingOpts = null;
  }

  completeMock(opts = {}) {
    const kind = LabCompletionKind.detect(opts);
    if (kind && this._completeMocks[kind] != null) return { text: this._completeMocks[kind] };
    if (this._completeMocks.default != null) return { text: this._completeMocks.default };
    return null;
  }

  manifest() {
    return { steps: this.steps.map((s) => ({ ...s })), outDir: this.outDir };
  }

  _stepKey(label) {
    const n = (this._labelCounts[label] = (this._labelCounts[label] || 0) + 1);
    return n > 1 ? `${label}#${n}` : label;
  }

  _replayFrozen(key, label, opts, frozen) {
    this._pendingKey = null;
    const record = this._record(key, label, opts, frozen, true);
    return { frozen: { b64: frozen.b64, mime: frozen.mime || LabHarness.DEFAULT_MIME }, record };
  }

  _record(key, label, opts, result, replayed, effective) {
    const record = {
      key, label, seq: ++this._seq, replayed: !!replayed,
      params: LabStepParams.overlayResolved(LabStepParams.scrub(opts), effective),
      ok: !!(result && result.b64),
      mime: (result && result.mime) || null,
      file: this._writeImage(key, result),
    };
    this.steps.push(record);
    this._emitStep(record, opts, result);
    return record;
  }

  _writeImage(key, result) {
    if (!result || !result.b64 || !this.outDir) return null;
    try {
      const name = `${String(this._seq).padStart(2, '0')}-${key.replace(/[^a-z0-9_#-]/gi, '_')}.png`;
      fs.writeFileSync(path.join(this.outDir, name), Buffer.from(result.b64, 'base64'));
      return name;
    } catch (_) {
      return null;
    }
  }

  _emitStep(record, opts, result) {
    try {
      this._emit('lab:step', {
        ...record,
        b64: (result && result.b64) || null,
        inputs: {
          initImage: opts.initImage || null,
          refImages: Array.isArray(opts.refImages) ? opts.refImages.filter(Boolean) : [],
        },
      });
    } catch (_) {}
  }

  _ensureOutDir() {
    if (!this.outDir) return;
    try { fs.mkdirSync(this.outDir, { recursive: true }); } catch (_) {}
  }
}

module.exports = LabHarness;
