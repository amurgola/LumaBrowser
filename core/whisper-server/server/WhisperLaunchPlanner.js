const os = require('os');
const path = require('path');
const MediaLaunchPlanner = require('../../media-shared/MediaLaunchPlanner');

class WhisperLaunchPlanner extends MediaLaunchPlanner {
  static HOST = '127.0.0.1';
  static MIN_THREADS = 2;
  static MAX_THREADS = 8;

  _validate() {
    this._requireOption('binaryPath');
    this._requireOption('modelPath');
    this._requireOption('port');
  }

  _resolveSettings() {
    this._englishOnly = WhisperLaunchPlanner.isEnglishOnlyModel(this._options.modelPath);
    this._threads = this._resolveThreads();
    this._language = this._resolveLanguage();
  }

  _buildArgs() {
    return [
      '-m', this._options.modelPath,
      '--host', WhisperLaunchPlanner.HOST,
      '--port', String(this._options.port),
      '-t', String(this._threads),
      '-l', this._language,
    ];
  }

  _resolveBinaryPath() {
    return this._options.binaryPath;
  }

  _describePlan() {
    return {
      port: this._options.port,
      modelPath: this._options.modelPath,
      modelName: path.basename(this._options.modelPath),
      threads: this._threads,
      language: this._language,
      englishOnly: this._englishOnly,
    };
  }

  _resolveThreads() {
    const requested = Number(this._options.threads);
    if (requested > 0) return requested;
    const injected = Number(this._options.cpuCount);
    const cores = injected > 0 ? injected : os.cpus().length;
    const half = Math.floor(cores / 2);
    return Math.min(WhisperLaunchPlanner.MAX_THREADS, Math.max(WhisperLaunchPlanner.MIN_THREADS, half));
  }

  _resolveLanguage() {
    if (this._englishOnly) return 'en';
    return (this._options.language || 'auto').toLowerCase();
  }

  static isEnglishOnlyModel(modelPath) {
    const name = path.basename(modelPath).toLowerCase();
    return /\.en[.-]/.test(name) || /\.en\.bin$/.test(name);
  }
}

module.exports = WhisperLaunchPlanner;
