const BasaltKvMode = require('./BasaltKvMode');

class BasaltContextSizer {
  static GiB = 1024 * 1024 * 1024;
  static MiB = 1024 * 1024;
  static CTX_LADDER = [262144, 196608, 163840, 131072, 98304, 65536, 49152, 32768, 24576, 16384, 8192, 4096];
  static CARD_RESERVE_BYTES = Math.round(2.5 * BasaltContextSizer.GiB);

  static needBytes(pack, kv, ctx, slots = 1) {
    const perPosition = BasaltKvMode.bytesPerPosition(pack, kv) || 0;
    const extraSlots = Math.max(0, slots - 1) * (Number(pack.slotStateBytes) || 0);
    return (Number(pack.cardFixedBytes) || 0) + extraSlots + ctx * perPosition;
  }

  static fit({ requested, nativeCtx, pack, kv, slots = 1, vramBytes }) {
    const S = BasaltContextSizer;
    const contextSize = Math.min(requested, nativeCtx);
    if (!pack || pack.sizing !== 'card') return S._engineSized(contextSize, vramBytes);
    const budget = vramBytes ? vramBytes - S.CARD_RESERVE_BYTES : null;
    const need = (ctx) => S.needBytes(pack, kv, ctx, slots);
    if (budget == null || need(contextSize) <= budget) return { contextSize, fits: true, estimatedBytes: need(contextSize), notes: [] };
    const rung = S.CTX_LADDER.find((c) => c <= contextSize && need(c) <= budget);
    if (rung) return { contextSize: rung, fits: true, estimatedBytes: need(rung), notes: [S._reducedNote(contextSize, rung, need(contextSize), vramBytes)] };
    return { contextSize, fits: false, estimatedBytes: need(contextSize), notes: [S._noFitNote(pack, vramBytes)] };
  }

  static formatBytes(n) {
    const v = Number(n) || 0;
    if (v >= BasaltContextSizer.GiB) return `${(v / BasaltContextSizer.GiB).toFixed(1)} GiB`;
    return `${Math.round(v / BasaltContextSizer.MiB)} MiB`;
  }

  static _engineSized(contextSize, vramBytes) {
    const estimatedBytes = vramBytes ? vramBytes - BasaltContextSizer.CARD_RESERVE_BYTES : null;
    return {
      contextSize,
      fits: true,
      estimatedBytes,
      notes: ['Basalt places this model\'s experts between the card, RAM and the pack file itself, and refuses at start a context that does not fit.'],
    };
  }

  static _reducedNote(from, to, needed, vramBytes) {
    const fmt = BasaltContextSizer.formatBytes;
    return `Context reduced from ${from.toLocaleString()} to ${to.toLocaleString()} tokens: ${fmt(needed)} would not fit the ${fmt(vramBytes)} card with ${fmt(BasaltContextSizer.CARD_RESERVE_BYTES)} kept free.`;
  }

  static _noFitNote(pack, vramBytes) {
    const fmt = BasaltContextSizer.formatBytes;
    const ladder = BasaltContextSizer.CTX_LADDER;
    return `Even ${ladder[ladder.length - 1].toLocaleString()} tokens of context do not fit beside ${fmt(pack.cardFixedBytes)} of weights and workspace on the ${fmt(vramBytes)} card.`;
  }
}

module.exports = BasaltContextSizer;
