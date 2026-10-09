class ImageModelPicker {
  static GB = 1024 * 1024 * 1024;
  static IMAGE_HEADROOM = 2 * ImageModelPicker.GB;
  static IMAGE_RANK = ['flux-1-schnell', 'z-image-turbo', 'sd-1-5'];
  static MIN_GPU_BYTES = 1.5 * ImageModelPicker.GB;

  static cardBudgetBytesFromHw(hw) {
    const cards = ImageModelPicker._cardBudgets(hw);
    const largest = cards.length ? Math.max(...cards) : ImageModelPicker._bytes(hw && hw.usableVramBytes);
    return largest > ImageModelPicker.MIN_GPU_BYTES ? largest : 0;
  }

  static pickImageModel(imageModels, opts) {
    ImageModelPicker._rejectBareNumber(opts);
    const cardBudgetBytes = ImageModelPicker._bytes(opts && opts.cardBudgetBytes);
    const generate = (imageModels || []).filter((m) => m && m.kind === 'generate');
    const ranked = ImageModelPicker._rankedModels(generate);
    const fitting = ranked.find((m) => ImageModelPicker._fits(m, cardBudgetBytes));
    if (fitting) return { model: fitting, offload: false };
    const fallback = ImageModelPicker._fallback(ranked, generate);
    return fallback ? { model: fallback, offload: true } : null;
  }

  static _cardBudgets(hw) {
    if (!hw || !Array.isArray(hw.gpus)) return [];
    return hw.gpus.map((g) => ImageModelPicker._bytes(g && g.maxBytes)).filter((b) => b > 0);
  }

  static _rejectBareNumber(opts) {
    if (typeof opts === 'number') {
      throw new TypeError('pickImageModel: pass { cardBudgetBytes }, one card, not a whole-box VRAM total');
    }
  }

  static _rankedModels(generate) {
    const byId = new Map(generate.map((m) => [m.id, m]));
    return ImageModelPicker.IMAGE_RANK.map((id) => byId.get(id)).filter(Boolean);
  }

  static _fits(model, cardBudgetBytes) {
    return ImageModelPicker._bytes(model.minVramBytes) + ImageModelPicker.IMAGE_HEADROOM <= cardBudgetBytes;
  }

  static _fallback(ranked, generate) {
    const lightest = ranked.slice().sort((a, b) => ImageModelPicker._bytes(a.minVramBytes) - ImageModelPicker._bytes(b.minVramBytes))[0];
    return lightest || generate[0] || null;
  }

  static _bytes(value) {
    return Math.max(0, Number(value) || 0);
  }
}

module.exports = ImageModelPicker;
