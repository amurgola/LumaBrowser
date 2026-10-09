class MlxFitClassifier {
  static FITS_FRACTION = 0.7;

  static TIGHT_FRACTION = 0.85;

  static classify(totalBytes, hw) {
    const ram = Math.max(0, Number(hw && hw.usableRamBytes) || 0);
    const need = Math.max(0, Number(totalBytes) || 0);
    if (!ram) return { tier: 'spill', badge: 'amber', label: 'Unknown memory, proceed with care' };
    if (need <= ram * MlxFitClassifier.FITS_FRACTION) return { tier: 'fits', badge: 'green', label: 'Fits, runs on the Apple GPU' };
    if (need <= ram * MlxFitClassifier.TIGHT_FRACTION) return { tier: 'tight', badge: 'amber', label: 'Tight, close other apps' };
    if (need <= ram) return { tier: 'spill', badge: 'orange', label: 'Very tight, may swap' };
    return { tier: 'too-big', badge: 'red', label: 'Too large for this Mac' };
  }
}

module.exports = MlxFitClassifier;
