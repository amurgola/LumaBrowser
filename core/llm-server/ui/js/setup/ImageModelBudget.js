export default class ImageModelBudget {
  static GB = 1024 * 1024 * 1024;

  static IMAGE_RANK = ['flux-1-schnell', 'z-image-turbo', 'sd-1-5'];

  static IMAGE_HEADROOM = 2 * ImageModelBudget.GB;

  static MIN_GPU_BYTES = 1.5 * ImageModelBudget.GB;

  static cardBudgetBytes(hw) {
    const bytes = ImageModelBudget._bytes;
    const total = bytes(hw && hw.usableVramBytes);
    const cards = (hw && Array.isArray(hw.gpus)) ? hw.gpus.map((g) => bytes(g && g.maxBytes)).filter((b) => b > 0) : [];
    const largest = cards.length ? Math.max(...cards) : total;
    return largest > ImageModelBudget.MIN_GPU_BYTES ? largest : 0;
  }

  static pickImageModel(catalog, hw) {
    const models = (catalog || []).filter((m) => m && m.kind === 'generate');
    if (!models.length) return null;
    const budget = ImageModelBudget.cardBudgetBytes(hw);
    const ranked = ImageModelBudget._ranked(models);
    const fitting = ranked.find((m) => (Number(m.minVramBytes) || 0) + ImageModelBudget.IMAGE_HEADROOM <= budget);
    if (fitting) return fitting;
    const lightest = ranked.slice().sort((a, b) => (a.minVramBytes || 0) - (b.minVramBytes || 0));
    return lightest[0] || models[0];
  }

  static _ranked(models) {
    const byId = {};
    for (const m of models) byId[m.id] = m;
    return ImageModelBudget.IMAGE_RANK.map((id) => byId[id]).filter(Boolean);
  }

  static _bytes(value) {
    return Math.max(0, Number(value) || 0);
  }
}
