const NvidiaSmi = require('../../core/shared/runtime/NvidiaSmi');
const VramCoordinator = require('../../core/shared/runtime/VramCoordinator');

class TrainingGpu {
  static SERVER_ID = 'lora-trainer';
  static GB = 1024 * 1024 * 1024;
  static NO_GPU = 'No NVIDIA graphics card was found. LoRA training needs one.';
  static SETTLE_READS = 6;
  static SETTLE_MS = 1500;

  constructor({ queryGpus = () => NvidiaSmi.queryGpus(), coordinator = VramCoordinator.shared, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) } = {}) {
    this._queryGpus = queryGpus;
    this._coordinator = coordinator;
    this._sleep = sleep;
  }

  async claim(recipe) {
    const card = await this._settledCard(recipe);
    if (!card) throw new Error(TrainingGpu.NO_GPU);
    this._coordinator.hold(TrainingGpu.SERVER_ID, { devices: [card.index], bytes: card.totalBytes, role: 'image' });
    return {
      cudaDevice: String(card.index),
      name: card.name,
      totalGb: TrainingGpu._gb(card.totalBytes),
      freeGb: TrainingGpu._gb(card.freeBytes),
      warning: TrainingGpu.warningFor(card, recipe),
    };
  }

  release() {
    this._coordinator.release(TrainingGpu.SERVER_ID);
  }

  async _settledCard(recipe) {
    let card = null;
    for (let read = 0; read < TrainingGpu.SETTLE_READS; read += 1) {
      card = TrainingGpu.strongest(await this._cards());
      if (!card || !TrainingGpu.tooFull(card, recipe)) return card;
      await this._sleep(TrainingGpu.SETTLE_MS);
    }
    return card;
  }

  async _cards() {
    try {
      return (await this._queryGpus()) || [];
    } catch (_) {
      return [];
    }
  }

  static strongest(cards) {
    return (cards || []).slice().sort((a, b) => (b.totalBytes - a.totalBytes) || (a.index - b.index))[0] || null;
  }

  static tooFull(card, recipe) {
    const needGb = Number(recipe && recipe.minVramGb) || 0;
    return needGb > 0 && TrainingGpu._gb(card.totalBytes) >= needGb && TrainingGpu._gb(card.freeBytes) < needGb;
  }

  static warningFor(card, recipe) {
    const needGb = Number(recipe && recipe.minVramGb) || 0;
    if (!needGb) return null;
    const freeGb = TrainingGpu._gb(card.freeBytes);
    if (TrainingGpu._gb(card.totalBytes) < needGb) return `${card.name} has less than the ${needGb} GB this model's training usually needs; it may run out of memory.`;
    if (freeGb < needGb) return `Only ${freeGb} GB is free on ${card.name} and training usually needs ${needGb} GB. Unload other models from that card if it runs out of memory.`;
    return null;
  }

  static _gb(bytes) {
    return Math.round(((Number(bytes) || 0) / TrainingGpu.GB) * 10) / 10;
  }
}

module.exports = TrainingGpu;
