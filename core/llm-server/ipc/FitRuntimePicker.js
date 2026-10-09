const LlmRuntimeCatalog = require('../runtimes/LlmRuntimeCatalog');

class FitRuntimePicker {
  static FLASH_ATTN = '--flash-attn';
  static VULKAN = 'llama-cpp-vulkan';
  static CPU = 'llama-cpp-cpu';

  static pick(model, runtimesView, diagnostics, catalog = LlmRuntimeCatalog.shared) {
    const byId = new Map(((runtimesView && runtimesView.runtimes) || []).map((r) => [r.id, r]));
    const usable = (id) => FitRuntimePicker._usable(byId.get(id));
    const preferred = (model.preferredRuntimes || []).map(usable).find(Boolean);
    if (preferred) return preferred;
    const compatible = new Set(model.compatibleRuntimes || []);
    const ranked = FitRuntimePicker.hostOrder(diagnostics, catalog).filter((id) => compatible.has(id));
    return ranked.map(usable).find(Boolean) || null;
  }

  static hostOrder(diagnostics, catalog = LlmRuntimeCatalog.shared) {
    const diag = diagnostics || {};
    const cudaAvailable = !!(diag.cuda && diag.cuda.available);
    const order = [];
    if (cudaAvailable) order.push(...catalog.cudaRuntimePreference(diag.cuda && diag.cuda.cudaVersion));
    if (FitRuntimePicker._hasRealGpu(diag) || !cudaAvailable) order.push(FitRuntimePicker.VULKAN);
    order.push(FitRuntimePicker.CPU);
    return order;
  }

  static _usable(runtime) {
    if (!runtime || !runtime.installed || !runtime.binaryPath) return null;
    if (Array.isArray(runtime.unsupportedFlags) && runtime.unsupportedFlags.includes(FitRuntimePicker.FLASH_ATTN)) return null;
    return runtime;
  }

  static _hasRealGpu(diag) {
    return !!(diag.gpu && Array.isArray(diag.gpu.adapters) && diag.gpu.adapters.some((a) => a.vendor && a.vendor !== 'Microsoft'));
  }
}

module.exports = FitRuntimePicker;
