const fs = require('fs');
const path = require('path');

class RpcServerBinary {
  static RUNTIME_PREFERENCE = ['llama-cpp-cuda13', 'llama-cpp-cuda12', 'llama-cpp-vulkan', 'llama-cpp-rocm', 'llama-cpp-sycl', 'llama-cpp-cpu'];
  static VENDOR_BUILDS = ['llama-cpp-rocm', 'llama-cpp-sycl'];

  static binaryNames(platform = process.platform) {
    return platform === 'win32'
      ? ['ggml-rpc-server.exe', 'rpc-server.exe']
      : ['ggml-rpc-server', 'rpc-server'];
  }

  static resolve(llmServerService, { platform = process.platform } = {}) {
    for (const dir of RpcServerBinary._candidateDirs(llmServerService)) {
      const found = RpcServerBinary._firstExisting(dir, RpcServerBinary.binaryNames(platform));
      if (found) return found;
    }
    return null;
  }

  static _candidateDirs(llmServerService) {
    try {
      const root = llmServerService && llmServerService.getRuntimesDir ? llmServerService.getRuntimesDir() : null;
      if (!root) return [];
      return RpcServerBinary._runtimeOrder(llmServerService).map((id) => path.join(root, id));
    } catch (_) {
      return [];
    }
  }

  static _runtimeOrder(llmServerService) {
    const defaults = llmServerService.getDefaults ? llmServerService.getDefaults() : null;
    const preferred = defaults && defaults.runtimeId;
    const base = RpcServerBinary._withLoadedVendorBuildsFirst(llmServerService);
    if (!preferred) return base;
    return [preferred, ...base.filter((id) => id !== preferred)];
  }

  static _withLoadedVendorBuildsFirst(llmServerService) {
    const view = typeof llmServerService.getCachedRuntimesView === 'function' ? llmServerService.getCachedRuntimesView() : null;
    const rows = (view && Array.isArray(view.runtimes)) ? view.runtimes : [];
    const loaded = RpcServerBinary.VENDOR_BUILDS.filter((id) => rows.some((r) => r && r.id === id && r.installed && r.backend && r.backend.checked && r.backend.ok === true));
    if (loaded.length === 0) return RpcServerBinary.RUNTIME_PREFERENCE;
    const rest = RpcServerBinary.RUNTIME_PREFERENCE.filter((id) => !loaded.includes(id));
    const vulkanAt = rest.indexOf('llama-cpp-vulkan');
    return [...rest.slice(0, vulkanAt), ...loaded, ...rest.slice(vulkanAt)];
  }

  static _firstExisting(dir, names) {
    for (const name of names) {
      const candidate = path.join(dir, name);
      try {
        if (fs.existsSync(candidate)) return candidate;
      } catch (_) {}
    }
    return null;
  }
}

module.exports = RpcServerBinary;
