class ImageLaunchInputs {
  static NO_RUNTIME = 'No default image runtime selected.';
  static NO_MODEL = 'No default image model selected.';
  static NO_API_KEY = 'API security is enabled but no keys exist. Create one in Settings → API Security before starting the image server.';

  constructor({ runtimeDetector, scanner }) {
    this._detector = runtimeDetector;
    this._scanner = scanner;
  }

  static defaultsRefusal(runtimeId, modelId) {
    if (!runtimeId) return ImageLaunchInputs.NO_RUNTIME;
    if (!modelId) return ImageLaunchInputs.NO_MODEL;
    return null;
  }

  async runtime({ runtimeId, runtimesRoot, diagnostics, manualBinaries }) {
    const view = await this._detector.detectRuntimes({
      runtimesRoot, cuda: diagnostics.cuda, gpu: diagnostics.gpu, manualBinaries,
    });
    const runtime = (view.runtimes || []).find((r) => r.id === runtimeId);
    const error = ImageLaunchInputs._runtimeRefusal(runtimeId, runtime);
    return error ? { error } : { runtime };
  }

  async model({ modelId, modelsDir }) {
    const scan = await this._scanner.scan(modelsDir);
    const model = (scan.models || []).find((m) => m.id === modelId);
    return model ? { model } : { error: `Image model "${modelId}" not found in ${modelsDir}.` };
  }

  static apiKeyRefusal(apiKeyInfo) {
    return apiKeyInfo && apiKeyInfo.required && !apiKeyInfo.key ? ImageLaunchInputs.NO_API_KEY : null;
  }

  static _runtimeRefusal(runtimeId, runtime) {
    if (!runtime) return `Image runtime ${runtimeId} not found.`;
    if (!runtime.installed) return `Image runtime ${runtime.name} is not installed.`;
    if (!runtime.binaryPath) return `Image runtime ${runtime.name} has no usable binary.`;
    return null;
  }
}

module.exports = ImageLaunchInputs;
