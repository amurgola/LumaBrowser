const os = require('os');
const path = require('path');

class TrainerPaths {
  static RUNTIME_ID = 'lora-trainer';
  static WORK_DIR = 'work';

  static UV_CACHE_NAME = 'luma-uv';

  constructor({ baseDir, platform = process.platform, tempDir = os.tmpdir() }) {
    this._baseDir = baseDir;
    this._windows = platform === 'win32';
    this._tempDir = tempDir;
  }

  get runtimeDir() { return path.join(this._baseDir, 'runtimes', TrainerPaths.RUNTIME_ID); }
  get uvDir() { return path.join(this.runtimeDir, 'uv'); }
  get uvCacheDir() { return path.join(this._tempDir, TrainerPaths.UV_CACHE_NAME); }
  get pythonInstallDir() { return path.join(this.runtimeDir, 'python'); }
  get sourceRoot() { return path.join(this.runtimeDir, 'src'); }
  get venvDir() { return path.join(this.runtimeDir, 'venv'); }
  get manifestPath() { return path.join(this.runtimeDir, 'trainer.json'); }
  get requirementsPath() { return path.join(this.runtimeDir, 'requirements.resolved.txt'); }
  get constraintsPath() { return path.join(this.runtimeDir, 'torch.constraints.txt'); }

  get uvBinaryNames() { return this._windows ? ['uv.exe'] : ['uv']; }

  get pythonPath() {
    return this._windows ? path.join(this.venvDir, 'Scripts', 'python.exe') : path.join(this.venvDir, 'bin', 'python');
  }

  sourceDir(ref) { return path.join(this.sourceRoot, `ai-toolkit-${ref}`); }

  get workDir() { return path.join(this.runtimeDir, TrainerPaths.WORK_DIR); }
  get hubCacheDir() { return path.join(this.workDir, 'hf'); }
  get jobsDir() { return path.join(this.workDir, 'jobs'); }

  jobDir(jobId) { return path.join(this.jobsDir, jobId); }
  datasetDir(jobId) { return path.join(this.jobDir(jobId), 'dataset'); }
  outputDir(jobId) { return path.join(this.jobDir(jobId), 'output'); }
  configPath(jobId) { return path.join(this.jobDir(jobId), 'config.json'); }
  logPath(jobId) { return path.join(this.jobDir(jobId), 'train.log'); }
  jobFile(jobId) { return path.join(this.jobDir(jobId), 'job.json'); }
}

module.exports = TrainerPaths;
