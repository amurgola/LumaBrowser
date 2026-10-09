const ImageSlotRoles = require('./ImageSlotRoles');
const CudaDevicePicker = require('../../shared/runtime/CudaDevicePicker');

class ImageSlotPlacement {
  static GB = 1024 * 1024 * 1024;
  static PAD_BYTES = 2 * ImageSlotPlacement.GB;
  static FALLBACK_BYTES = { video: 16 * ImageSlotPlacement.GB, edit: 12 * ImageSlotPlacement.GB, generate: 8 * ImageSlotPlacement.GB };
  static AUTO_FIT_FLAG = '--auto-fit';

  constructor({ vramCoordinator, capabilities }) {
    this._vram = vramCoordinator;
    this._capabilities = capabilities;
  }

  static requiredBytes(model, role) {
    const { isEdit, isVideo } = ImageSlotRoles.profile(role, model || {});
    const fallback = ImageSlotPlacement.FALLBACK_BYTES[isVideo ? 'video' : (isEdit ? 'edit' : 'generate')];
    return (Number(model && model.minVramBytes) || fallback) + ImageSlotPlacement.PAD_BYTES;
  }

  static isCpuOnlyRuntime(runtime) {
    const id = String((runtime && runtime.id) || '');
    return id === 'sd-cpp-cpu' || /(^|-)cpu$/i.test(id);
  }

  static budgetString(devices, debitedCards) {
    const roomOf = new Map(debitedCards.map((d) => [d.index, CudaDevicePicker.cardRoomBytes(d)]));
    return devices
      .map((phys, i) => `cuda${i}=${Math.max(1, (roomOf.get(phys) || 0) / ImageSlotPlacement.GB).toFixed(1)}`)
      .join(',');
  }

  async place({ role, runtime, requiredBytes, settingsDb, diagnostics }) {
    if (ImageSlotPlacement.isCpuOnlyRuntime(runtime)) return ImageSlotPlacement._unplaced();
    const request = { serverId: role, role: 'image', requiredBytes, settingsDb, diagnostics };
    const single = this._reserveOneCard(request);
    if (!single.offloadToCpu) return single;
    return (await this._autoFitRescue(request, runtime)) || single;
  }

  _reserveOneCard(request) {
    try {
      const place = this._vram.reserve({ ...request, allowSplit: false });
      return { cudaDevice: place.cudaDevice, offloadToCpu: place.offloadToCpu, autoFit: null };
    } catch (_) {
      return ImageSlotPlacement._unplaced();
    }
  }

  async _autoFitRescue(request, runtime) {
    try {
      const cards = this._vram.debitedDevices(request.diagnostics, { excludeServerId: request.serverId });
      if (cards.length < 2 || !(await this._capabilities.supportsFlag(runtime.binaryPath, ImageSlotPlacement.AUTO_FIT_FLAG))) return null;
      const split = this._vram.reserve({ ...request, allowSplit: true });
      if (split.offloadToCpu || !Array.isArray(split.devices) || split.devices.length < 1) return null;
      return {
        cudaDevice: split.devices.join(','),
        offloadToCpu: false,
        autoFit: split.devices.length >= 2 ? ImageSlotPlacement.budgetString(split.devices, cards) : null,
      };
    } catch (_) {
      return null;
    }
  }

  static _unplaced() {
    return { cudaDevice: null, offloadToCpu: false, autoFit: null };
  }
}

module.exports = ImageSlotPlacement;
