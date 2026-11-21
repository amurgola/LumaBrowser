const ContextLadder = require('./ContextLadder');
const FitRows = require('./FitRows');
const RungEstimator = require('./RungEstimator');
const RungTip = require('./RungTip');

class ContextRungBuilder {
  constructor(estimator) {
    this._estimator = estimator;
  }

  build(ctx) {
    const { fitRows, tokens, kv } = ctx;
    const okRow = FitRows.okRow(fitRows, tokens, kv);
    if (okRow) return this._measuredOk(ctx, okRow);
    if (FitRows.anyRow(fitRows, tokens, kv)) return ContextRungBuilder._withTip(ContextRungBuilder._measuredFailure(tokens, kv));
    return this._estimated(ctx);
  }

  _measuredOk(ctx, row) {
    const { tokens, kv } = ctx;
    const today = this._estimate(ctx, { vramBytes: row.vramBytes, fullOffload: row.fullOffload === true, shape: row.shape });
    const measured = row.tokensPerSec != null ? row.tokensPerSec : null;
    const rung = {
      tokens,
      label: ContextLadder.label(tokens),
      source: 'fit',
      state: 'ok',
      kv,
      tokensPerSec: measured,
      tokensPerSecSource: measured != null ? 'measured' : null,
      vramBytes: row.vramBytes != null ? row.vramBytes : null,
    };
    if (today.state === 'partial' || today.state === 'no') {
      const predicted = RungEstimator.predictedTps(today);
      Object.assign(rung, { state: today.state, tokensPerSec: predicted, tokensPerSecSource: predicted != null ? 'predicted' : null });
    }
    return { ...rung, tip: RungTip.for({ ...rung, est: today }) };
  }

  static _measuredFailure(tokens, kv) {
    return {
      tokens, label: ContextLadder.label(tokens), source: 'fit', state: 'no', kv,
      tokensPerSec: null, tokensPerSecSource: null, vramBytes: null,
    };
  }

  _estimated(ctx) {
    const { tokens, kv } = ctx;
    const est = this._estimate(ctx, null);
    const predicted = RungEstimator.predictedTps(est);
    const rung = {
      tokens,
      label: ContextLadder.label(tokens),
      source: 'estimate',
      state: est.state,
      kv,
      tokensPerSec: predicted,
      tokensPerSecSource: predicted != null ? 'predicted' : null,
      vramBytes: est.vramBytes,
    };
    return { ...rung, tip: RungTip.for({ ...rung, est }) };
  }

  _estimate({ model, runtime, diagnostics, settingsDb, tokens, kv }, measured) {
    return this._estimator.estimate(model, runtime, diagnostics, tokens, kv, { settingsDb, measured });
  }

  static _withTip(rung) {
    return { ...rung, tip: RungTip.for(rung) };
  }
}

module.exports = ContextRungBuilder;
