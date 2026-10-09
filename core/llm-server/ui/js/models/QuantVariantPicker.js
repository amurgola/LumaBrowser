export default class QuantVariantPicker {
  static defaultIndex(variants) {
    const green = QuantVariantPicker._largest(variants, (v) => v.fit && v.fit.tier === 'fits');
    if (green >= 0) return green;
    const tight = QuantVariantPicker._largest(variants, (v) => v.fit && v.fit.tier === 'tight');
    if (tight >= 0) return tight;
    const any = QuantVariantPicker._largest(variants, () => true);
    return any >= 0 ? any : 0;
  }

  static _largest(variants, predicate) {
    let index = -1;
    let bytes = -1;
    variants.forEach((v, i) => {
      if (!predicate(v)) return;
      if (v.approxBytes > bytes) { bytes = v.approxBytes; index = i; }
    });
    return index;
  }
}
