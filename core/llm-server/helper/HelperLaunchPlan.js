const CudaDeviceProbe = require('../../shared/runtime/CudaDeviceProbe');
const CudaDevicePicker = require('../../shared/runtime/CudaDevicePicker');

class HelperLaunchPlan {
  static RUNTIME_PREFERENCE = Object.freeze(['llama-cpp-luma', 'llama-cpp-cuda13', 'llama-cpp-cuda12', 'llama-cpp-cpu']);
  static SLOTS = 2;
  static GPU_LAYERS = 99;
  static HEALTH_TIMEOUT_MS = 10 * 60 * 1000;

  static pickRuntime(runtimes, defaultRuntimeId) {
    const usable = (runtimes || []).filter((r) => r && r.installed && r.binaryPath && /^llama-cpp/.test(r.id));
    if (!usable.length) throw new Error('No llama.cpp runtime is installed.');
    for (const id of HelperLaunchPlan.RUNTIME_PREFERENCE) {
      const hit = usable.find((r) => r.id === id);
      if (hit) return hit;
    }
    return usable.find((r) => r.id === defaultRuntimeId) || usable[0];
  }

  static pickDevice(setting, diagnostics = null) {
    if (setting !== undefined) return setting;
    let devices = [];
    try { devices = CudaDeviceProbe.readDevices(diagnostics) || []; } catch (_) { devices = []; }
    if (devices.length < 2) return null;
    const chosen = CudaDevicePicker.pick(devices, null);
    return chosen.length ? String(chosen[0].index) : null;
  }

  static buildArgs({ modelPath, port, contextSize }) {
    return [
      '-m', modelPath,
      '--host', '127.0.0.1', '--port', String(port),
      '-ngl', String(HelperLaunchPlan.GPU_LAYERS),
      '-c', String(contextSize),
      '-np', String(HelperLaunchPlan.SLOTS),
      '--jinja',
      '-fa', 'on',
    ];
  }

  static build({ runtime, modelPath, port, contextSize, cudaDevice }) {
    return {
      binaryPath: runtime.binaryPath,
      args: HelperLaunchPlan.buildArgs({ modelPath, port, contextSize }),
      plan: { port, runtimeId: runtime.id, modelPath, contextSize, cudaDevice: cudaDevice == null ? null : String(cudaDevice) },
      healthTimeoutMs: HelperLaunchPlan.HEALTH_TIMEOUT_MS,
      cudaDevice: cudaDevice == null ? null : String(cudaDevice),
    };
  }
}

module.exports = HelperLaunchPlan;
