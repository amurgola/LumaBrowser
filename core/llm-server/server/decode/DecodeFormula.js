class DecodeFormula {
  static WEIGHT_STREAM_EFFICIENCY = 0.85;

  static HISTORY_READ_EFFICIENCY = 0.5;

  static GPU_STEP_MS = 3;

  static CPU_STEP_MS = 15;

  static RPC_HOP_MS = 3;

  static TENSOR_SPLIT_LAYER_SYNC_MS = 0.25;

  static estimateTps({ domains, fixedMs, depth, parallel = false, syncMs = 0 }) {
    const stepTimes = (domains || []).map((d) => DecodeFormula._domainMs(d, depth)).filter((ms) => ms != null);
    const bytesMs = parallel ? Math.max(0, ...stepTimes) : stepTimes.reduce((a, b) => a + b, 0);
    return DecodeFormula.tpsFromMs((Number(fixedMs) || 0) + (Number(syncMs) || 0) + bytesMs);
  }

  static tpsFromMs(ms) {
    return Number.isFinite(ms) && ms > 0 ? Math.round((1000 / ms) * 10) / 10 : null;
  }

  static describeTps(tps) {
    const n = Number(tps);
    if (!Number.isFinite(n) || n <= 0) return '';
    return n >= 10 ? `about ${Math.round(n)} tok/s` : `about ${n.toFixed(1)} tok/s`;
  }

  static bandwidthSourceOf(domains) {
    const floors = domains.filter((d) => d.bandwidthSource === 'floor').length;
    if (floors === 0) return 'table';
    return floors === domains.length ? 'floor' : 'mixed';
  }

  static _domainMs(domain, depth) {
    const bandwidth = (Number(domain && domain.bandwidthGbps) || 0) * 1e9;
    if (!(bandwidth > 0)) return null;
    const weightBytes = Math.max(0, Number(domain.weightBytesPerToken) || 0);
    const historyBytes = Math.max(0, Number(DecodeFormula._historyAt(domain.historyBytesPerToken, depth)) || 0);
    return (weightBytes / (DecodeFormula.WEIGHT_STREAM_EFFICIENCY * bandwidth)) * 1000
      + (historyBytes / (DecodeFormula.HISTORY_READ_EFFICIENCY * bandwidth)) * 1000;
  }

  static _historyAt(history, depth) {
    return typeof history === 'function' ? history(depth) : history;
  }
}

module.exports = DecodeFormula;
