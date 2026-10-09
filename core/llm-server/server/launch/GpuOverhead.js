const CudaDevicePicker = require('../../../shared/runtime/CudaDevicePicker');

class GpuOverhead {
  static PER_CARD_RESERVE = CudaDevicePicker.PER_CARD_RESERVE_BYTES;

  static FIXED = 512 * 1024 * 1024;

  static FIXED_NO_FLASH_ATTN = 1024 * 1024 * 1024;

  static NO_HEADER_FACTOR = 1.2;

  static fixed(flashAttnSupported) {
    return flashAttnSupported ? GpuOverhead.FIXED : GpuOverhead.FIXED_NO_FLASH_ATTN;
  }
}

module.exports = GpuOverhead;
