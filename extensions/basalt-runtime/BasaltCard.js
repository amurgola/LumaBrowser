const BasaltCatalog = require('./BasaltCatalog');

class BasaltCard {
  static MiB = 1024 * 1024;
  static NOT_A_MAIN_CARD = -1;

  static pick(devices, build) {
    const candidates = (Array.isArray(devices) ? devices : [])
      .map((device, index) => ({ device, index, rank: BasaltCard.generationRank(device, build) }))
      .filter((candidate) => candidate.rank !== BasaltCard.NOT_A_MAIN_CARD);
    if (candidates.length === 0) return null;
    const best = candidates.reduce((a, b) => (BasaltCard._beats(b, a) ? b : a));
    return BasaltCard.describe(best.device, best.index);
  }

  static describe(device, index) {
    return {
      index,
      name: device.name || null,
      vramBytes: BasaltCard._vram(device) * BasaltCard.MiB || null,
      computeCapability: device.computeCapability || null,
    };
  }

  static generationRank(device, build) {
    if (!device || !build) return BasaltCard.NOT_A_MAIN_CARD;
    const capability = String(device.computeCapability || '');
    const hasCapability = /^\d+\.\d+$/.test(capability);
    return build.mainCards.findIndex((card) => (hasCapability
      ? new RegExp(card.capability).test(capability)
      : new RegExp(card.names, 'i').test(String(device.name || ''))));
  }

  static noCardReason(build) {
    return `${build.name} needs an NVIDIA ${BasaltCatalog.mainCardsText(build)} card as its main GPU, and none was found.`;
  }

  static _beats(challenger, holder) {
    if (challenger.rank !== holder.rank) return challenger.rank < holder.rank;
    return BasaltCard._vram(challenger.device) > BasaltCard._vram(holder.device);
  }

  static _vram(device) {
    return Number(device.memoryTotalMB) || 0;
  }
}

module.exports = BasaltCard;
