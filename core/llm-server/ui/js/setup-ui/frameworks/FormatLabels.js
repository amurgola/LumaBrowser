export default class FormatLabels {
  static NOUNS = Object.freeze({
    gguf: 'GGUF models',
    mlx: 'MLX models',
    basalt: 'Basalt packs',
    ninfer: 'NInfer models',
  });

  static noun(formatId) {
    return FormatLabels.NOUNS[formatId] || String(formatId || '');
  }

  static loadsText(formatIds) {
    const nouns = (formatIds || []).map(FormatLabels.noun).filter(Boolean);
    return nouns.length ? `Loads ${nouns.join(' and ')}` : '';
  }
}
