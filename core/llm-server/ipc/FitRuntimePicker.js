const LlmRuntimeCatalog = require('../runtimes/LlmRuntimeCatalog');

class FitRuntimePicker {
  static FLASH_ATTN = '--flash-attn';
  static VULKAN = 'llama-cpp-vulkan';
  static CPU = 'llama-cpp-cpu';
  static ROCM = 'llama-cpp-rocm';
  static SYCL = 'llama-cpp-sycl';
  static OPENVINO = 'llama-cpp-openvino';

  static pick(model, runtimesView, diagnostics, catalog = LlmRuntimeCatalog.shared) {
    const byId = new Map(((runtimesView && runtimesView.runtimes) || []).map((r) => [r.id, r]));
    const usable = (id) => FitRuntimePicker._usable(byId.get(id));
    const preferred = (model.preferredRuntimes || []).map(usable).find(Boolean);
    if (preferred) return preferred;
    const compatible = new Set(model.compatibleRuntimes || []);
    const ranked = FitRuntimePicker.hostOrder(diagnostics, catalog, process.platform, runtimesView).filter((id) => compatible.has(id));
    return ranked.map(usable).find(Boolean) || null;
  }

  static hostOrder(diagnostics, catalog = LlmRuntimeCatalog.shared, platform = process.platform, runtimesView = null) {
    if (platform === 'darwin') return [FitRuntimePicker.CPU];
    const diag = diagnostics || {};
    const cudaAvailable = !!(diag.cuda && diag.cuda.available);
    const order = [];
    if (cudaAvailable) order.push(...catalog.cudaRuntimePreference(diag.cuda && diag.cuda.cudaVersion));
    const vendorBuilds = [];
    if (FitRuntimePicker._hasVendor(diag, 'AMD')) vendorBuilds.push(FitRuntimePicker.ROCM);
    if (FitRuntimePicker._hasVendor(diag, 'Intel')) vendorBuilds.push(FitRuntimePicker.SYCL);
    order.push(...vendorBuilds.filter((id) => FitRuntimePicker.backendLoaded(runtimesView, id)));
    if (FitRuntimePicker._hasRealGpu(diag) || !cudaAvailable) order.push(FitRuntimePicker.VULKAN);
    order.push(...vendorBuilds.filter((id) => !FitRuntimePicker.backendLoaded(runtimesView, id)));
    if (FitRuntimePicker._hasVendor(diag, 'Intel')) order.push(FitRuntimePicker.OPENVINO);
    order.push(FitRuntimePicker.CPU);
    return order;
  }

  static backendLoaded(runtimesView, id) {
    const row = ((runtimesView && runtimesView.runtimes) || []).find((r) => r && r.id === id);
    return !!(row && row.installed && row.backend && row.backend.checked && row.backend.ok === true);
  }

  static backendFailed(runtime) {
    return !!(runtime && runtime.backend && runtime.backend.checked && runtime.backend.ok === false);
  }

  static _usable(runtime) {
    if (!runtime || !runtime.installed || !runtime.binaryPath) return null;
    if (Array.isArray(runtime.unsupportedFlags) && runtime.unsupportedFlags.includes(FitRuntimePicker.FLASH_ATTN)) return null;
    if (FitRuntimePicker.backendFailed(runtime)) return null;
    return runtime;
  }

  static _hasVendor(diag, vendor) {
    return !!(diag.gpu && Array.isArray(diag.gpu.adapters) && diag.gpu.adapters.some((a) => a && a.vendor === vendor));
  }

  static _hasRealGpu(diag) {
    return !!(diag.gpu && Array.isArray(diag.gpu.adapters) && diag.gpu.adapters.some((a) => a.vendor && a.vendor !== 'Microsoft'));
  }
}

module.exports = FitRuntimePicker;
