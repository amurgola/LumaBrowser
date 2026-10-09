const fs = require('fs');
const CudaDevicePicker = require('../../shared/runtime/CudaDevicePicker');

class ClipPlacement {
  static GB = 1024 * 1024 * 1024;

  static TEXT_ENCODER_KEYS = ['t5xxl', 'clip_l', 'clip_g', 'llm', 'vision'];

  static textEncoderBytes(model, { statSync = fs.statSync } = {}) {
    let total = 0;
    for (const key of ClipPlacement.TEXT_ENCODER_KEYS) {
      const file = model && model.files && model.files[key];
      if (!file || !file.path) continue;
      total += ClipPlacement._sizeOf(file.path, statSync);
    }
    return total;
  }

  static decide({ model, cudaDevice, offloadToCpu, autoFit, requiredBytes, devices, encoderBytes, userPinned = false }) {
    if (!ClipPlacement._asksForCpuEncoders(model)) return { clipOnCpu: undefined, note: null };
    const limit = ClipPlacement._hardLimit({ cudaDevice, offloadToCpu, autoFit });
    if (limit) return ClipPlacement._keep(limit);
    if (userPinned) return ClipPlacement._onGpu(`card ${cudaDevice} was pinned in the placement canvas`);
    return ClipPlacement._decideByRoom({ model, cudaDevice, requiredBytes, devices, encoderBytes });
  }

  static _asksForCpuEncoders(model) {
    return Array.isArray(model && model.launchArgs) && model.launchArgs.includes('--clip-on-cpu');
  }

  static _hardLimit({ cudaDevice, offloadToCpu, autoFit }) {
    if (offloadToCpu) return 'weights offloaded';
    if (autoFit) return 'auto-fit split';
    if (cudaDevice == null || cudaDevice === '' || String(cudaDevice).includes(',')) return 'no single pinned card';
    return null;
  }

  static _decideByRoom({ model, cudaDevice, requiredBytes, devices, encoderBytes }) {
    const encoders = encoderBytes != null ? Number(encoderBytes) : ClipPlacement.textEncoderBytes(model);
    if (!(encoders > 0)) return ClipPlacement._keep('encoder size unknown');
    const room = ClipPlacement._roomOn(devices, cudaDevice);
    const need = (Number(requiredBytes) || 0) + encoders;
    const gb = ClipPlacement._gb;
    if (room >= need) return ClipPlacement._onGpu(`card ${cudaDevice} has ${gb(room)} GB for ${gb(need)} GB`);
    return ClipPlacement._keep(`card ${cudaDevice} has ${gb(room)} GB, weights + encoders need ${gb(need)} GB`);
  }

  static _roomOn(devices, cudaDevice) {
    const device = (devices || []).find((d) => String(d.index) === String(cudaDevice));
    return device ? CudaDevicePicker.cardRoomBytes(device) : 0;
  }

  static _sizeOf(filePath, statSync) {
    try {
      return Number(statSync(filePath).size) || 0;
    } catch (_) {
      return 0;
    }
  }

  static _keep(why) {
    return { clipOnCpu: true, note: `text encoders on CPU: ${why}` };
  }

  static _onGpu(why) {
    return { clipOnCpu: false, note: `text encoders on GPU: ${why}` };
  }

  static _gb(bytes) {
    return (bytes / ClipPlacement.GB).toFixed(1);
  }
}

module.exports = ClipPlacement;
