const CudaDevicePicker = require('../../../shared/runtime/CudaDevicePicker');

class GpuOverhead {
  static get PER_CARD_RESERVE() {
    return CudaDevicePicker.PER_CARD_RESERVE_BYTES;
  }

  static FIXED = 512 * 1024 * 1024;

  static FIXED_NO_FLASH_ATTN = 1024 * 1024 * 1024;

  static NO_HEADER_FACTOR = 1.2;

  static cardRoom(card, { cachedResident = 0 } = {}) {
    const total = Number(card && card.totalBytes) || 0;
    const occupied = card && card.occupiedBytes != null ? Number(card.occupiedBytes) : null;
    if (occupied != null && Number.isFinite(occupied)) return Math.max(0, total - Math.max(0, occupied) - GpuOverhead.PER_CARD_RESERVE);
    return Math.max(0, total - Math.max(GpuOverhead.PER_CARD_RESERVE, Number(cachedResident) || 0));
  }

  static fixed(flashAttnSupported) {
    return flashAttnSupported ? GpuOverhead.FIXED : GpuOverhead.FIXED_NO_FLASH_ATTN;
  }
}

module.exports = GpuOverhead;
