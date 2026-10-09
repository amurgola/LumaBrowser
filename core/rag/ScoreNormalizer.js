class ScoreNormalizer {
  static bm25Shares(rows) {
    const strengths = (rows || []).map((row) => [row.id, Math.max(0, -Number(row.rank) || 0)]);
    const best = Math.max(0, ...strengths.map(([, strength]) => strength));
    return new Map(strengths.map(([id, strength]) => [id, best > 0 ? strength / best : 1]));
  }

  static cosineAboveFloor(similarity, floor) {
    if (!(similarity >= floor)) return null;
    return Math.min(1, (similarity - floor) / (1 - floor));
  }
}

module.exports = ScoreNormalizer;
