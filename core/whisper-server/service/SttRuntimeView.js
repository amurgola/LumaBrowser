const fs = require('fs');
const path = require('path');
const SherpaRuntimeLayout = require('../../tts-server/runtimes/SherpaRuntimeLayout');
const WhisperRuntimeCatalog = require('../runtimes/WhisperRuntimeCatalog');

class SttRuntimeView {
  static SHERPA_RUNTIME_ID = 'sherpa-onnx';
  static SHERPA_ROW = {
    name: 'Speech engine (sherpa-onnx)',
    description: 'Runs Parakeet and Qwen3-ASR in-process. Shared with text-to-speech, so one install serves both.',
  };
  static CUDA_LLAMA_RUNTIMES = ['llama-cpp-cuda13', 'llama-cpp-cuda12'];
  static WHISPER_CUDA_ID = 'whisper-cpp-cublas';
  static WHISPER_CPU_ID = 'whisper-cpp-cpu';

  constructor({ launcher, catalog = new WhisperRuntimeCatalog(), platform = process.platform }) {
    this._launcher = launcher;
    this._catalog = catalog;
    this._platform = platform;
  }

  async build(runtimesRoot, model) {
    const installed = await this._launcher.findInstalledRuntime(runtimesRoot);
    const sherpaReady = SherpaRuntimeLayout.isInstalled(runtimesRoot);
    const engine = SttRuntimeView._engineFor(model, sherpaReady, installed);
    return {
      engine,
      runtimes: [SttRuntimeView._sherpaRow(sherpaReady)].concat(await this._whisperRows(runtimesRoot, installed)),
      runtimeReady: engine === 'sherpa' ? sherpaReady : !!installed,
      sherpaRuntimeReady: sherpaReady,
      whisperRuntimeReady: !!installed,
      activeRuntimeId: SttRuntimeView._activeRuntimeId(engine, sherpaReady, installed),
      recommendedRuntimeId: this.recommendedRuntimeId(runtimesRoot, engine),
      recommendedWhisperRuntimeId: this.recommendedRuntimeId(runtimesRoot, 'whisper'),
    };
  }

  recommendedRuntimeId(runtimesRoot, engine = 'sherpa') {
    if (engine === 'sherpa') return SttRuntimeView.SHERPA_RUNTIME_ID;
    if (this._platform === 'win32' && SttRuntimeView._hasCudaLlamaRuntime(runtimesRoot)) return SttRuntimeView.WHISPER_CUDA_ID;
    return SttRuntimeView.WHISPER_CPU_ID;
  }

  static _engineFor(model, sherpaReady, installed) {
    if (model) return model.engine;
    return sherpaReady || !installed ? 'sherpa' : 'whisper';
  }

  static _activeRuntimeId(engine, sherpaReady, installed) {
    if (engine === 'sherpa') return sherpaReady ? SttRuntimeView.SHERPA_RUNTIME_ID : null;
    return installed ? installed.id : null;
  }

  static _sherpaRow(sherpaReady) {
    return {
      id: SttRuntimeView.SHERPA_RUNTIME_ID,
      ...SttRuntimeView.SHERPA_ROW,
      installed: sherpaReady,
      requirementNote: null,
      engine: 'sherpa',
      platformSupported: !!SherpaRuntimeLayout.platformPackageName(),
    };
  }

  async _whisperRows(runtimesRoot, installed) {
    const rows = [];
    for (const entry of this._catalog.getCatalog()) {
      const isActive = !!(installed && installed.id === entry.id);
      rows.push({
        id: entry.id,
        name: entry.name,
        description: entry.description,
        installed: isActive || !!(await this._launcher.findRuntimeBinary(runtimesRoot, entry.id)),
        requirementNote: entry.requirementNote || null,
        engine: 'whisper',
      });
    }
    return rows;
  }

  static _hasCudaLlamaRuntime(runtimesRoot) {
    return SttRuntimeView.CUDA_LLAMA_RUNTIMES.some((id) => SttRuntimeView._dirHasEntries(path.join(runtimesRoot, id)));
  }

  static _dirHasEntries(dir) {
    try {
      return fs.readdirSync(dir).length > 0;
    } catch (_) {
      return false;
    }
  }
}

module.exports = SttRuntimeView;
