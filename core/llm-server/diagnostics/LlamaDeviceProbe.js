const DiagnosticsCommand = require('./DiagnosticsCommand');
const BinaryLookup = require('../../shared/runtime/BinaryLookup');
const ManagedDir = require('../../shared/runtime/install/ManagedDir');
const RuntimeSpawnEnv = require('../../shared/runtime/server/RuntimeSpawnEnv');

class LlamaDeviceProbe {
  static RUNTIME_IDS = ['llama-cpp-vulkan', 'llama-cpp-sycl', 'llama-cpp-rocm'];
  static BINARY_NAMES = ['llama-server'];
  static SEARCH_DEPTH = 3;
  static TIMEOUT_MS = 15000;
  static MIB = 1024 * 1024;
  static LINE = /^\s*([A-Za-z][\w-]*?\d+):\s+(.+?)\s+\((\d+)\s*MiB,\s*(\d+)\s*MiB free\)\s*$/;
  static SOFTWARE = /llvmpipe|lavapipe|swiftshader|softpipe/i;

  static async probe({ runtimesRoot, platform = process.platform, run = DiagnosticsCommand.run, findBinary = BinaryLookup.findBinaryIn } = {}) {
    if (platform !== 'linux' || !runtimesRoot) return null;
    for (const runtimeId of LlamaDeviceProbe.RUNTIME_IDS) {
      const devices = await LlamaDeviceProbe._listWith(runtimesRoot, runtimeId, { platform, run, findBinary });
      if (devices && devices.length > 0) return { runtimeId, devices };
    }
    return null;
  }

  static parse(text) {
    const devices = [];
    for (const line of String(text || '').split(/\r?\n/)) {
      const match = LlamaDeviceProbe.LINE.exec(line);
      if (!match || LlamaDeviceProbe.SOFTWARE.test(match[2])) continue;
      const totalBytes = Number(match[3]) * LlamaDeviceProbe.MIB;
      if (!(totalBytes > 0)) continue;
      devices.push({ id: match[1], name: match[2].trim(), totalBytes, freeBytes: Number(match[4]) * LlamaDeviceProbe.MIB });
    }
    return devices;
  }

  static async _listWith(runtimesRoot, runtimeId, { platform, run, findBinary }) {
    let binaryPath = null;
    try {
      binaryPath = await findBinary(ManagedDir.pathFor(runtimesRoot, runtimeId), LlamaDeviceProbe.BINARY_NAMES, { maxDepth: LlamaDeviceProbe.SEARCH_DEPTH });
    } catch (_) {}
    if (!binaryPath) return null;
    const spawn = RuntimeSpawnEnv.build(binaryPath, { platform });
    const result = await run(binaryPath, ['--list-devices'], LlamaDeviceProbe.TIMEOUT_MS, spawn);
    if (!result) return null;
    return LlamaDeviceProbe.parse(`${result.stdout || ''}\n${result.stderr || ''}`);
  }
}

module.exports = LlamaDeviceProbe;
