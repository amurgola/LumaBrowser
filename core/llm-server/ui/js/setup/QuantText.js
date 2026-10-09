export default class QuantText {
  static title(quant) {
    const tag = String(quant || '').toUpperCase();
    if (!tag) return '';
    return tag + ': ' + QuantText._gloss(tag);
  }

  static _gloss(tag) {
    if (['F16', 'FP16', 'BF16', 'F32'].some((p) => tag.startsWith(p))) {
      return 'full precision. The original weights: largest download, no quantization loss.';
    }
    if (tag.startsWith('Q8')) return '8-bit quantization. Near-lossless quality at about half the size of full precision.';
    if (tag.startsWith('Q6')) return '6-bit quantization. Very close to full quality with a solid memory saving.';
    if (tag.startsWith('Q5')) return '5-bit quantization. High fidelity; a little more memory than the 4-bit default.';
    if (tag.startsWith('Q4') || tag.startsWith('IQ4')) {
      return '4-bit quantization. The balanced default: near-full quality at roughly a quarter of full-precision memory.';
    }
    if (tag.startsWith('IQ') || tag.startsWith('Q2') || tag.startsWith('Q3')) {
      return 'aggressive quantization. Smallest memory footprint; fits modest GPUs with some quality cost on hard tasks.';
    }
    return 'quantization variant. Lower bit counts use less memory at some quality cost.';
  }
}
