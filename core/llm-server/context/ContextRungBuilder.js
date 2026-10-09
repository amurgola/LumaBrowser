const ContextLadder = require('./ContextLadder');
const FitRows = require('./FitRows');
const RungEstimator = require('./RungEstimator');
const RungTip = require('./RungTip');

class ContextRungBuilder {
  constructor(estimator) {
    this._estimator = estimator;
  }

  build({ model, runtime, diagnostics, fitRows, tokens, kv }) {
    const okRow = FitRows.okRow(fitRows, tokens, kv);
    if (okRow) return ContextRungBuilder._withTip(ContextRungBuilder._measuredOk(okRow, tokens, kv));
    if (FitRows.anyRow(fitRows, tokens, kv)) return ContextRungBuilder._withTip(ContextRungBuilder._measuredFailure(tokens, kv));
    return this._estimated({ model, runtime, diagnostics, tokens, kv });
  }

  static _measuredOk(row, tokens, kv) {
    const measured = row.tokensPerSec != null ? row.tokensPerSec : null;
    return {
      tokens,
      label: ContextLadder.label(tokens),
      source: 'fit',
      state: 'ok',
      kv,
      tokensPerSec: measured,
      tokensPerSecSource: measured != null ? 'measured' : null,
      vramBytes: row.vramBytes != null ? row.vramBytes : null,
    };
  }

  static _measuredFailure(tokens, kv) {
    return {
      tokens, label: ContextLadder.label(tokens), source: 'fit', state: 'no', kv,
      tokensPerSec: null, tokensPerSecSource: null, vramBytes: null,
    };
  }

  _estimated({ model, runtime, diagnostics, tokens, kv }) {
    const est = this._estimator.estimate(model, runtime, diagnostics, tokens, kv);
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

  static _withTip(rung) {
    return { ...rung, tip: RungTip.for(rung) };
  }
}

module.exports = ContextRungBuilder;
