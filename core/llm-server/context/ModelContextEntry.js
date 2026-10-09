const KvCacheModes = require('../../shared/llm/KvCacheModes');
const ModelName = require('../models/ModelName');
const ByteLadder = require('../server/ByteLadder');
const ContextLadder = require('./ContextLadder');
const FitRows = require('./FitRows');
const AutoContextPick = require('./AutoContextPick');

class ModelContextEntry {
  constructor({ estimator, rungBuilder }) {
    this._estimator = estimator;
    this._rungBuilder = rungBuilder;
  }

  static isChattable(model) {
    return !!(model && model.kind !== 'mmproj-only' && model.kind !== 'mtp-only'
      && model.weights && model.weights[0] && model.weights[0].path);
  }

  build({ model, runtime, diagnostics, fitEntry, displayNameFor }) {
    const gguf = (model.gguf && model.gguf.parsed) ? model.gguf : null;
    const fitRows = fitEntry && Array.isArray(fitEntry.results) ? fitEntry.results : null;
    const ctx = { model, runtime, diagnostics, fitRows };
    const rungs = ContextLadder.rungsFor(gguf && gguf.contextLength ? gguf.contextLength : null);
    const kvOptions = this._kvOptions(ctx, rungs);
    const contextOptions = AutoContextPick.ladder(kvOptions, KvCacheModes.OFFERED_MODES, rungs.length);
    return {
      ...ModelContextEntry._identity(model, gguf, fitEntry, displayNameFor),
      contextOptions,
      kvOptions,
      kvModes: KvCacheModes.OFFERED_MODES.map((m) => ({ id: m.id, short: m.short, help: m.help })),
      recommendedTokens: AutoContextPick.recommendedTokens(contextOptions),
      speed: this._speed(ctx, kvOptions),
    };
  }

  _kvOptions(ctx, rungs) {
    return Object.fromEntries(KvCacheModes.OFFERED_MODES.map((mode) => [
      mode.id,
      rungs.map((tokens) => this._rungBuilder.build({ ...ctx, tokens, kv: mode.id })),
    ]));
  }

  static _identity(model, gguf, fitEntry, displayNameFor) {
    const path = model.weights[0].path;
    const nameKey = ModelName.key(path);
    const nativeCtx = gguf && gguf.contextLength ? gguf.contextLength : null;
    const quant = gguf && gguf.fileTypeName ? gguf.fileTypeName : null;
    return {
      ref: `local::${nameKey}`,
      name: model.name,
      nameKey,
      displayName: displayNameFor ? displayNameFor(nameKey, model.name) : model.name,
      path,
      quant,
      architecture: gguf ? gguf.architecture || null : null,
      nativeCtx,
      totalBytes: model.totalBytes || null,
      hasFit: !!fitEntry,
      ranAt: fitEntry ? fitEntry.ranAt || null : null,
      hardware: fitEntry ? fitEntry.hardware || null : null,
      summary: ModelContextEntry._summary(model, gguf, quant, nativeCtx),
    };
  }

  static _summary(model, gguf, quant, nativeCtx) {
    const bits = [];
    if (quant) bits.push(quant);
    if (gguf && gguf.architecture) bits.push(gguf.architecture);
    if (nativeCtx) bits.push(`${ContextLadder.label(nativeCtx)} native`);
    bits.push(ByteLadder.format(model.totalBytes));
    return bits.join(' · ');
  }

  _speed(ctx, kvOptions) {
    const head = (kvOptions[KvCacheModes.OFFERED_MODES[0].id] || [])[0] || null;
    if (!head) return null;
    return {
      depth: head.tokens,
      kv: head.kv,
      measured: head.tokensPerSecSource === 'measured' ? head.tokensPerSec : null,
      predicted: head.tokensPerSecSource === 'predicted' ? head.tokensPerSec : null,
      measuredAtDepth: this._measuredAtDepth(ctx),
    };
  }

  _measuredAtDepth({ model, runtime, diagnostics, fitRows }) {
    const row = FitRows.depthProbeRow(fitRows);
    if (!row) return null;
    const kv = FitRows.kvOf(row);
    return {
      tokens: row.depthTokens,
      tokensPerSec: row.tokensPerSecAtDepth,
      prefillMs: row.depthPrefillMs != null ? row.depthPrefillMs : null,
      kv,
      predicted: this._estimator.predictedTpsAtDepth(model, runtime, diagnostics, row.depthTokens, kv),
    };
  }
}

module.exports = ModelContextEntry;
