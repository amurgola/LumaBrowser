const CudaDeviceProbe = require('./CudaDeviceProbe');
const CudaDevicePicker = require('./CudaDevicePicker');

class CudaPin {
  static SETTING_KEYS = Object.freeze({
    llm: 'core.llmServer.cudaDevice',
    image: 'core.imageServer.cudaDevice',
  });

  static resolveCudaDevice(settingsDb, role, opts = {}) {
    const explicit = CudaPin._explicitSetting(settingsDb, role);
    if (explicit !== undefined) return explicit;
    const devices = CudaDeviceProbe.readDevices(opts.diagnostics);
    if (devices.length < 2) return null;
    return CudaPin._pinFor(devices, opts.requiredBytes);
  }

  static filterDiagnosticsToDevices(diagnostics, deviceStr) {
    if (!deviceStr || !diagnostics || !diagnostics.cuda || !Array.isArray(diagnostics.cuda.devices)) {
      return diagnostics;
    }
    const wanted = CudaPin._deviceIndices(deviceStr);
    if (wanted.size === 0) return diagnostics;
    const devices = diagnostics.cuda.devices.filter((_, i) => wanted.has(i));
    if (devices.length === 0) return diagnostics;
    return { ...diagnostics, cuda: { ...diagnostics.cuda, devices } };
  }

  static applyCudaDeviceEnv(env, device) {
    if (device === null || device === undefined || device === '') return env;
    env.CUDA_VISIBLE_DEVICES = String(device);
    if (!env.CUDA_DEVICE_ORDER) env.CUDA_DEVICE_ORDER = 'PCI_BUS_ID';
    return env;
  }

  static _explicitSetting(settingsDb, role) {
    const key = role === 'image' ? CudaPin.SETTING_KEYS.image : CudaPin.SETTING_KEYS.llm;
    let value = null;
    try { value = settingsDb && settingsDb.get ? settingsDb.get(key, null) : null; } catch (_) { value = null; }
    if (value === null || value === undefined) return undefined;
    const trimmed = String(value).trim();
    return trimmed === '' ? null : trimmed;
  }

  static _pinFor(devices, requiredBytes) {
    const chosen = CudaDevicePicker.pick(devices, requiredBytes);
    if (chosen.length === 0 || chosen.length === devices.length) return null;
    return chosen.map((d) => d.index).join(',');
  }

  static _deviceIndices(deviceStr) {
    return new Set(String(deviceStr).split(',').map((s) => Number(s.trim())).filter((n) => Number.isInteger(n)));
  }
}

module.exports = CudaPin;
