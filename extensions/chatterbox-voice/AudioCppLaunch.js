const fs = require('fs');
const os = require('os');
const path = require('path');
const CoreRequire = require('./CoreRequire');
const AudioCppInstallation = require('./AudioCppInstallation');
const ChatterboxModels = require('./ChatterboxModels');

const FreePort = CoreRequire.load('shared/runtime/FreePort');

class AudioCppLaunch {
  static PORT_RANGE = { start: 8220, end: 8239 };
  static CONFIG_FILE = 'luma-server.json';
  static HEALTH_TIMEOUT_MS = 60 * 1000;

  constructor({ runtimesRoot, modelsDir, voices = [], preferredRuntimeId = null, threads = null }) {
    this._runtimesRoot = runtimesRoot;
    this._modelsDir = modelsDir;
    this._voices = voices;
    this._preferredRuntimeId = preferredRuntimeId;
    this._threads = threads;
  }

  static resolve(options) {
    return new AudioCppLaunch(options).execute();
  }

  async execute() {
    this._requireRuntime();
    this._resolveModels();
    this._port = await FreePort.findFreePort({ range: AudioCppLaunch.PORT_RANGE });
    const configPath = await this._writeConfig();
    return this._launch(configPath);
  }

  _requireRuntime() {
    this._found = AudioCppInstallation.findInstalledRuntime(this._runtimesRoot, this._preferredRuntimeId);
    if (this._found) return;
    const err = new Error('The Chatterbox engine (audio.cpp) is not installed yet. Install it in Setup, Voice cloning.');
    err.code = 'TTS_RUNTIME_MISSING';
    err.installable = true;
    throw err;
  }

  _resolveModels() {
    this._models = ChatterboxModels.getModels()
      .filter((m) => fs.existsSync(path.join(this._modelsDir, m.file)))
      .map((m) => this._modelEntry(m));
    if (this._models.length) return;
    const err = new Error('No Chatterbox model downloaded yet. Download one in Setup, Voice cloning.');
    err.code = 'NO_TTS_MODEL';
    throw err;
  }

  _modelEntry(m) {
    const entry = {
      id: m.id,
      family: m.family,
      path: AudioCppLaunch._forwardSlashes(path.join(this._modelsDir, m.file)),
      task: m.task === 'clone' ? 'clon' : 'tts',
      mode: 'offline',
    };
    if (m.task === 'clone' && this._voices.length) entry.voice_presets = this._voicePresets();
    return entry;
  }

  _voicePresets() {
    const presets = {};
    for (const v of this._voices) {
      const preset = { voice_ref: AudioCppLaunch._forwardSlashes(v.refPath) };
      if (v.referenceText) preset.reference_text = v.referenceText;
      presets[v.id] = preset;
    }
    return presets;
  }

  async _writeConfig() {
    const config = {
      host: '127.0.0.1',
      port: this._port,
      backend: this._found.backend,
      threads: this._threads || Math.max(2, Math.min(8, Math.floor(os.cpus().length / 2))),
      lazy_load: true,
      max_loaded_models: 2,
      idle_unload_ms: 0,
      models: this._models,
    };
    const configPath = path.join(this._runtimesRoot, this._found.id, AudioCppLaunch.CONFIG_FILE);
    await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2));
    return configPath;
  }

  _launch(configPath) {
    const { id, backend, binaryPath } = this._found;
    return {
      binaryPath,
      args: ['--config', configPath, '--no-ui'],
      plan: { port: this._port, runtimeId: id, backend, models: this._models.map((m) => m.id), voices: this._voices.length },
      healthTimeoutMs: AudioCppLaunch.HEALTH_TIMEOUT_MS,
    };
  }

  static _forwardSlashes(p) {
    return String(p).replace(/\\/g, '/');
  }
}

module.exports = AudioCppLaunch;
