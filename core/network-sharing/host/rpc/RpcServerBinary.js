const fs = require('fs');
const path = require('path');

class RpcServerBinary {
  static RUNTIME_PREFERENCE = ['llama-cpp-cuda13', 'llama-cpp-cuda12', 'llama-cpp-vulkan', 'llama-cpp-cpu'];

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
    if (!preferred) return RpcServerBinary.RUNTIME_PREFERENCE;
    return [preferred, ...RpcServerBinary.RUNTIME_PREFERENCE.filter((id) => id !== preferred)];
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
