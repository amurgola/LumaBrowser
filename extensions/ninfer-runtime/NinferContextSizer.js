const NinferBytes = require('./NinferBytes');
const NinferCatalog = require('./NinferCatalog');

class NinferContextSizer {
  static CTX_LADDER = [262144, 196608, 163840, 131072, 98304, 65536, 49152, 32768, 24576, 16384, 8192, 4096];
  static CARD_RESERVE_BYTES = Math.round(1.5 * NinferCatalog.GiB);

  static needBytes(weightsBytes, ctx) {
    return weightsBytes + ctx * NinferCatalog.KV_BYTES_PER_TOKEN + NinferCatalog.WORKSPACE_BYTES;
  }

  static fit({ requested, nativeCtx, weightsBytes, vramBytes }) {
    const S = NinferContextSizer;
    const contextSize = Math.min(requested, nativeCtx);
    const budget = vramBytes ? vramBytes - S.CARD_RESERVE_BYTES : null;
    if (budget == null || S.needBytes(weightsBytes, contextSize) <= budget) return { contextSize, fits: true, notes: [] };
    const rung = S.CTX_LADDER.find((c) => c <= contextSize && S.needBytes(weightsBytes, c) <= budget);
    if (rung) return { contextSize: rung, fits: true, notes: [S._reducedNote(contextSize, rung, weightsBytes, vramBytes)] };
    return { contextSize, fits: false, notes: [S._noFitNote(weightsBytes)] };
  }

  static _reducedNote(from, to, weightsBytes, vramBytes) {
    const fmt = NinferBytes.format;
    return `Context reduced from ${from.toLocaleString()} to ${to.toLocaleString()} tokens: ${fmt(NinferContextSizer.needBytes(weightsBytes, from))} would not fit the ${fmt(vramBytes)} card with ${fmt(NinferContextSizer.CARD_RESERVE_BYTES)} kept free.`;
  }

  static _noFitNote(weightsBytes) {
    const ladder = NinferContextSizer.CTX_LADDER;
    return `Even ${ladder[ladder.length - 1]} tokens of context does not fit alongside ${NinferBytes.format(weightsBytes)} of weights on this card.`;
  }
}

module.exports = NinferContextSizer;
