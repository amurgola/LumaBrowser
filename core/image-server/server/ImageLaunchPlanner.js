const path = require('path');
const MediaLaunchPlanner = require('../../media-shared/MediaLaunchPlanner');

class ImageLaunchPlanner extends MediaLaunchPlanner {
  static GIB = 1024 * 1024 * 1024;
  static HOST = '127.0.0.1';

  static FILE_ROLE_FLAGS = [
    ['highNoise', '--high-noise-diffusion-model', false],
    ['vae', '--vae', false],
    ['audioVae', '--audio-vae', true],
    ['llm', '--llm', false],
    ['clip_l', '--clip_l', false],
    ['t5xxl', '--t5xxl', false],
    ['vision', '--llm_vision', true],
    ['clipVision', '--clip_vision', true],
  ];

  static PERFORMANCE_FLAGS = ['--diffusion-fa', '--diffusion-conv-direct', '--vae-conv-direct'];

  static inferLoaderFlag(filePath) {
    const ext = path.extname(filePath || '').toLowerCase();
    return ext === '.gguf' ? '--diffusion-model' : '-m';
  }

  static preferSdServer(binaryPath) {
    const base = path.basename(binaryPath).toLowerCase();
    if (base.startsWith('sd-server')) return binaryPath;
    const ext = process.platform === 'win32' ? '.exe' : '';
    return path.join(path.dirname(binaryPath), `sd-server${ext}`);
  }

  _validate() {
    const { model, runtime, port } = this._options;
    if (!model) throw new Error('ImageLaunchPlanner: model is required');
    if (!runtime) throw new Error('ImageLaunchPlanner: runtime is required');
    if (!runtime.binaryPath) throw new Error('ImageLaunchPlanner: runtime has no binaryPath');
    if (!port || typeof port !== 'number') throw new Error('ImageLaunchPlanner: port is required');
    const diffusion = model.files && model.files.diffusion;
    if (!diffusion || !diffusion.path) throw new Error('ImageLaunchPlanner: model.files.diffusion.path is required');
  }

  _resolveSettings() {
    const { runtime, overrides } = this._options;
    this._overrides = overrides || {};
    this._unsupported = new Set(Array.isArray(runtime.unsupportedFlags) ? runtime.unsupportedFlags : []);
    this._autoFit = !!this._overrides.autoFit && !this._unsupported.has('--auto-fit');
  }

  _buildArgs() {
    return [
      ...this._listenArgs(),
      ...this._fileRoleArgs(),
      ...this._performanceArgs(),
      ...this._vaeTilingArgs(),
      ...this._loraDirArgs(),
      ...this._autoFitArgs(),
      ...this._offloadArgs(),
      ...this._modelLaunchArgs(),
      ...this._runtimeExtraArgs(),
    ];
  }

  _resolveBinaryPath() {
    return ImageLaunchPlanner.preferSdServer(this._options.runtime.binaryPath);
  }

  _describePlan(args) {
    const { model, runtime, port, publicPort } = this._options;
    return {
      port: typeof publicPort === 'number' && publicPort > 0 ? publicPort : port,
      privatePort: port,
      modelId: model.id,
      runtimeId: runtime.id,
      offloadToCpu: args.includes('--offload-to-cpu'),
      autoFit: args.includes('--auto-fit'),
      vaeTiling: args.includes('--vae-tiling'),
      flashAttention: args.includes('--diffusion-fa'),
      files: ImageLaunchPlanner._fileBasenames(model.files),
    };
  }

  _listenArgs() {
    const diffusion = this._options.model.files.diffusion;
    const loaderFlag = diffusion.loaderFlag || ImageLaunchPlanner.inferLoaderFlag(diffusion.path);
    return [
      loaderFlag, diffusion.path,
      '--listen-ip', ImageLaunchPlanner.HOST,
      '--listen-port', String(this._options.port),
      '-v',
    ];
  }

  _fileRoleArgs() {
    const files = this._options.model.files;
    const args = [];
    for (const [role, defaultFlag, roleMayOverride] of ImageLaunchPlanner.FILE_ROLE_FLAGS) {
      const file = files[role];
      if (!file || !file.path) continue;
      const flag = roleMayOverride ? (file.loaderFlag || defaultFlag) : defaultFlag;
      args.push(flag, file.path);
    }
    return args;
  }

  _performanceArgs() {
    return ImageLaunchPlanner.PERFORMANCE_FLAGS.filter((flag) => !this._unsupported.has(flag));
  }

  _vaeTilingArgs() {
    return this._overrides.vaeTiling && !this._unsupported.has('--vae-tiling') ? ['--vae-tiling'] : [];
  }

  _loraDirArgs() {
    const loraDir = this._overrides.loraDir;
    return loraDir && !this._unsupported.has('--lora-model-dir') ? ['--lora-model-dir', loraDir] : [];
  }

  _autoFitArgs() {
    if (!this._autoFit) return [];
    const args = this._overrides.autoFitForm === 'bare' ? ['--auto-fit'] : ['--auto-fit', 'on'];
    const budget = this._overrides.autoFit;
    if (typeof budget === 'string' && budget.length) args.push('--max-vram', budget);
    return args;
  }

  _offloadArgs() {
    if (this._autoFit) return [];
    const usableVram = ImageLaunchPlanner._usableVramBytes(this._options.diagnostics);
    const minVram = Number(this._options.model.minVramBytes) || 0;
    const tooSmall = minVram > 0 && usableVram > 0 && usableVram < minVram;
    return this._overrides.offloadToCpu || tooSmall ? ['--offload-to-cpu'] : [];
  }

  _modelLaunchArgs() {
    const launchArgs = this._options.model.launchArgs;
    if (!Array.isArray(launchArgs)) return [];
    const dropClipOnCpu = this._overrides.clipOnCpu === false;
    return launchArgs.filter((arg) => !(dropClipOnCpu && arg === '--clip-on-cpu'));
  }

  _runtimeExtraArgs() {
    const extraArgs = this._options.runtime.extraArgs;
    return Array.isArray(extraArgs) ? [...extraArgs] : [];
  }

  static _usableVramBytes(diagnostics) {
    if (!diagnostics) return 0;
    const vram = (diagnostics.budget || {}).vram || {};
    return Number(vram.maxBytes) || Number(vram.totalBytes) || 0;
  }

  static _fileBasenames(files) {
    const names = {};
    for (const [role, file] of Object.entries(files)) {
      if (file && file.path) names[role] = path.basename(file.path);
    }
    return names;
  }
}

module.exports = ImageLaunchPlanner;
