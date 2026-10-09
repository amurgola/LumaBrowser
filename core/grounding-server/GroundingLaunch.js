const GroundingModelFiles = require('./GroundingModelFiles');

class GroundingLaunch {
  static CONTEXT = 12288;
  static OVERHEAD_BYTES = 2.5 * 1024 ** 3;
  static IMAGE_MIN_TOKENS = 1024;
  static IMAGE_MAX_TOKENS = 8192;
  static HEALTH_TIMEOUT_MS = 3 * 60 * 1000;
  static RUNTIME_ID = /^llama-cpp/;

  static buildArgs({ modelPath, mmprojPath, port, offloadToCpu = false }) {
    return [
      '-m', modelPath,
      '--mmproj', mmprojPath,
      '-ngl', offloadToCpu ? '0' : '999',
      '-c', String(GroundingLaunch.CONTEXT),
      '--image-min-tokens', String(GroundingLaunch.IMAGE_MIN_TOKENS),
      '--image-max-tokens', String(GroundingLaunch.IMAGE_MAX_TOKENS),
      '--host', '127.0.0.1', '--port', String(port),
      '-np', '1',
      '--jinja',
    ];
  }

  static requiredBytes(modelPath, mmprojPath) {
    return GroundingModelFiles.sizeOf(modelPath) + GroundingModelFiles.sizeOf(mmprojPath) + GroundingLaunch.OVERHEAD_BYTES;
  }

  static plan({ port, modelPath, mmprojPath, runtimeId }) {
    return { port, modelPath, mmprojPath, modelName: GroundingModelFiles.modelName(modelPath), runtimeId };
  }

  static async pickRuntime(llmServerService) {
    if (!llmServerService || typeof llmServerService.ensureRuntimesView !== 'function') {
      throw new Error('No llama.cpp runtime view available.');
    }
    const view = await llmServerService.ensureRuntimesView();
    const usable = (view.runtimes || []).filter(GroundingLaunch._isUsableRuntime);
    if (!usable.length) throw new Error('No llama.cpp runtime is installed. Install one in the LLM tab first.');
    const preferred = llmServerService.getDefaults && llmServerService.getDefaults().runtimeId;
    return usable.find((r) => r.id === preferred) || usable[0];
  }

  static _isUsableRuntime(runtime) {
    return !!(runtime && runtime.installed && runtime.binaryPath && GroundingLaunch.RUNTIME_ID.test(runtime.id));
  }
}

module.exports = GroundingLaunch;
