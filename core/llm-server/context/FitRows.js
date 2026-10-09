const KvCacheModes = require('../../shared/llm/KvCacheModes');

class FitRows {
  static DEFAULT_KV = 'f16';

  static kvOf(row) {
    return row.kv || FitRows.DEFAULT_KV;
  }

  static okRow(rows, tokens, kv) {
    if (!Array.isArray(rows)) return null;
    const ok = rows.filter((r) => r && r.contextTokens === tokens && r.status === 'ok');
    if (ok.length === 0) return null;
    if (kv) return ok.find((r) => FitRows.kvOf(r) === kv) || null;
    return FitRows._highestPrecision(ok);
  }

  static anyRow(rows, tokens, kv) {
    if (!Array.isArray(rows)) return null;
    return rows.find((r) => r && r.contextTokens === tokens && (!kv || FitRows.kvOf(r) === kv)) || null;
  }

  static depthProbeRow(rows) {
    if (!Array.isArray(rows)) return null;
    const probed = rows.filter((r) => r && r.status === 'ok'
      && Number(r.tokensPerSecAtDepth) > 0 && Number(r.depthTokens) > 0);
    if (probed.length === 0) return null;
    return FitRows._highestPrecision(probed);
  }

  static measuredComboVram(fitEntry, tokens, kv) {
    const rows = fitEntry && Array.isArray(fitEntry.results) ? fitEntry.results : null;
    if (!rows) return null;
    const want = kv || FitRows.DEFAULT_KV;
    const row = rows.find((r) => r && r.status === 'ok'
      && r.fullOffload !== false
      && Number(r.contextTokens) === Number(tokens)
      && FitRows.kvOf(r) === want
      && Number(r.vramBytes) > 0);
    return row ? Math.round(Number(row.vramBytes)) : null;
  }

  static _highestPrecision(rows) {
    for (const mode of KvCacheModes.MODES) {
      const hit = rows.find((r) => FitRows.kvOf(r) === mode.id);
      if (hit) return hit;
    }
    return rows[0];
  }
}

module.exports = FitRows;
