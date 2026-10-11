class OpenVinoDevice {
  static RUNTIME_ID = 'llama-cpp-openvino';
  static ENV = 'GGML_OPENVINO_DEVICE';
  static DEVICES = Object.freeze(['GPU', 'NPU', 'CPU']);
  static GPU = 'GPU';
  static NPU = 'NPU';
  static CPU = 'CPU';

  static normalize(value) {
    const upper = String(value || '').toUpperCase();
    return OpenVinoDevice.DEVICES.includes(upper) ? upper : null;
  }

  static resolve(choice, diagnostics) {
    return OpenVinoDevice.normalize(choice) || (OpenVinoDevice._hasIntelGpu(diagnostics) ? 'GPU' : 'CPU');
  }

  static appliesTo(runtimeId) {
    return runtimeId === OpenVinoDevice.RUNTIME_ID;
  }

  static spawnEnv(baseEnv, device) {
    if (!device) return baseEnv || null;
    return { ...(baseEnv || {}), [OpenVinoDevice.ENV]: device };
  }

  static _hasIntelGpu(diagnostics) {
    const adapters = diagnostics && diagnostics.gpu && diagnostics.gpu.adapters;
    return Array.isArray(adapters) && adapters.some((a) => a && a.vendor === 'Intel');
  }
}

module.exports = OpenVinoDevice;
