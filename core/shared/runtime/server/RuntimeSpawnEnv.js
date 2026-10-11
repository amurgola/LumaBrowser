const path = require('path');
const CudaPin = require('../CudaPin');

class RuntimeSpawnEnv {
  static build(binaryPath, { cudaDevice = null, env = process.env, platform = process.platform, extraEnv = null } = {}) {
    const cwd = path.dirname(binaryPath);
    const childEnv = { ...env };
    RuntimeSpawnEnv._prependSearchPath(childEnv, cwd, platform);
    RuntimeSpawnEnv._prependLibraryPath(childEnv, cwd, platform);
    CudaPin.applyCudaDeviceEnv(childEnv, cudaDevice);
    RuntimeSpawnEnv._applyExtraEnv(childEnv, extraEnv);
    return { cwd, env: childEnv };
  }

  static _applyExtraEnv(env, extraEnv) {
    if (!extraEnv || typeof extraEnv !== 'object') return;
    for (const [key, value] of Object.entries(extraEnv)) {
      if (env[key] === undefined && value != null) env[key] = String(value);
    }
  }

  static isPinned(cudaDevice) {
    return cudaDevice !== null && cudaDevice !== undefined && cudaDevice !== '';
  }

  static _prependSearchPath(env, dir, platform) {
    const key = platform === 'win32' ? 'Path' : 'PATH';
    const sep = platform === 'win32' ? ';' : ':';
    const existing = env[key] || '';
    const entries = existing.split(sep).map((p) => p && p.toLowerCase());
    if (entries.includes(dir.toLowerCase())) return;
    env[key] = existing ? `${dir}${sep}${existing}` : dir;
  }

  static _prependLibraryPath(env, dir, platform) {
    if (platform !== 'linux') return;
    env.LD_LIBRARY_PATH = env.LD_LIBRARY_PATH ? `${dir}:${env.LD_LIBRARY_PATH}` : dir;
  }
}

module.exports = RuntimeSpawnEnv;
