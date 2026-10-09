const HotswapRamGate = require('../../../shared/runtime/HotswapRamGate');

class RamPinAdvice {
  static advise({ placement, llmPick, image, ramTotal }) {
    const pinBytes = [(llmPick && llmPick.weightsBytes) || 0, (image && image.approxTotalBytes) || 0];
    const pooled = placement.kind === 'singularity';
    const fits = pooled && HotswapRamGate.evaluate({
      ramTotalBytes: ramTotal,
      poolBytes: pinBytes,
      inFlightCopy: llmPick.mode !== 'moe-cpu',
    }).viable;
    if (fits) return { recommended: true, reason: 'singularity', bytes: pinBytes[0] + pinBytes[1] };
    return { recommended: false, reason: pooled ? 'ram-gate' : placement.kind, bytes: 0 };
  }
}

module.exports = RamPinAdvice;
