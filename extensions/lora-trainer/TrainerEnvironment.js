const CudaPin = require('../../core/shared/runtime/CudaPin');

class TrainerEnvironment {
  static HIJACKERS = [
    'PYTHONPATH', 'PYTHONHOME', 'PYTHONSTARTUP', 'PYTHONUSERBASE', 'PIP_CONFIG_FILE', 'VIRTUAL_ENV',
    'CONDA_PREFIX', 'CONDA_DEFAULT_ENV', 'PYENV_ROOT', 'PYENV_VERSION',
  ];

  constructor({ paths, base = process.env }) {
    this._paths = paths;
    this._base = base;
  }

  forInstall() {
    return {
      ...this._clean(),
      UV_PYTHON_INSTALL_DIR: this._paths.pythonInstallDir,
      UV_CACHE_DIR: this._paths.uvCacheDir,
      UV_NO_MODIFY_PATH: '1',
    };
  }

  forTraining(cudaDevice = null) {
    const env = {
      ...this._clean(),
      HF_HOME: this._paths.hubCacheDir,
      HF_HUB_DISABLE_TELEMETRY: '1',
      DISABLE_TELEMETRY: 'YES',
      PYTHONUNBUFFERED: '1',
      PYTHONIOENCODING: 'utf-8',
    };
    return CudaPin.applyCudaDeviceEnv(env, cudaDevice);
  }

  _clean() {
    const env = { ...this._base };
    for (const name of TrainerEnvironment.HIJACKERS) delete env[name];
    return env;
  }
}

module.exports = TrainerEnvironment;
