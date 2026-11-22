const BasaltCatalog = require('./BasaltCatalog');

class BasaltCard {
  static COMPUTE_MAJOR = 12;
  static MiB = 1024 * 1024;
  static NO_CARD_REASON = 'Basalt needs an NVIDIA Blackwell card (compute capability 12.0, such as the RTX 5090) as its main GPU, and none was found.';

  static pick(devices) {
    const candidates = (Array.isArray(devices) ? devices : [])
      .map((device, index) => ({ device, index }))
      .filter(({ device }) => BasaltCard.isBlackwell(device));
    if (candidates.length === 0) return null;
    const best = candidates.reduce((a, b) => (BasaltCard._vram(b.device) > BasaltCard._vram(a.device) ? b : a));
    return BasaltCard._describe(best.device, best.index);
  }

  static isBlackwell(device) {
    if (!device) return false;
    const capability = String(device.computeCapability || '');
    if (/^\d+\.\d+$/.test(capability)) return Number(capability.split('.')[0]) === BasaltCard.COMPUTE_MAJOR;
    return new RegExp(BasaltCatalog.BLACKWELL_NAME_PATTERN, 'i').test(String(device.name || ''));
  }

  static _vram(device) {
    return Number(device.memoryTotalMB) || 0;
  }

  static _describe(device, index) {
    return {
      index,
      name: device.name || null,
      vramBytes: BasaltCard._vram(device) * BasaltCard.MiB || null,
      computeCapability: device.computeCapability || null,
    };
  }
}

module.exports = BasaltCard;
