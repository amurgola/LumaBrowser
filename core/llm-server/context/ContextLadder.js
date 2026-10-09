class ContextLadder {
  static RUNGS = Object.freeze([8192, 16384, 32768, 65536, 131072, 262144]);

  static LABELS = Object.freeze({
    8192: '8k', 16384: '16k', 32768: '32k', 65536: '64k', 131072: '128k', 262144: '256k',
  });

  static label(tokens) {
    const n = Number(tokens) || 0;
    return ContextLadder.LABELS[n] || `${Math.round(n / 1024)}k`;
  }

  static rungsFor(nativeCtx) {
    const rungs = ContextLadder.RUNGS.filter((c) => !nativeCtx || c <= nativeCtx);
    if (rungs.length > 0) return rungs;
    return nativeCtx ? [nativeCtx] : [ContextLadder.RUNGS[0]];
  }
}

module.exports = ContextLadder;
