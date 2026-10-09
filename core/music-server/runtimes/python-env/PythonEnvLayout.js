const path = require('path');

class PythonEnvLayout {
  static UV_TARBALL = 'uv-linux.tar.gz';

  constructor({ mode, runtimesRoot, id, wslRoot = null }) {
    this.mode = mode;
    this._runtimesRoot = runtimesRoot;
    this._id = id;
    this._wslRoot = wslRoot;
  }

  static wslRootFor(homeDir) {
    return `${homeDir}/.lumabrowser`;
  }

  static uvDownloadUrl(arch = process.arch) {
    const triple = arch === 'arm64' ? 'aarch64-unknown-linux-gnu' : 'x86_64-unknown-linux-gnu';
    return `https://github.com/astral-sh/uv/releases/latest/download/uv-${triple}.tar.gz`;
  }

  get isWsl() {
    return this.mode === 'wsl';
  }

  get managedDir() {
    return path.join(this._runtimesRoot, this._id);
  }

  get toolsDir() {
    return path.join(this._runtimesRoot, 'tools');
  }

  get uvTarball() {
    return path.join(this.toolsDir, PythonEnvLayout.UV_TARBALL);
  }

  get wslToolsDir() {
    return `${this._wslRoot}/tools`;
  }

  get wslRuntimeDir() {
    return `${this._wslRoot}/runtimes/${this._id}`;
  }

  get uvPath() {
    return this.isWsl ? `${this.wslToolsDir}/uv` : path.join(this.toolsDir, 'uv');
  }

  get venvPath() {
    return this.isWsl ? `${this.wslRuntimeDir}/venv` : path.join(this.managedDir, 'venv');
  }

  get pythonPath() {
    return this.venvBin('python');
  }

  get binPath() {
    return this.venvBin('sgl-omni');
  }

  venvBin(name) {
    return this.isWsl ? `${this.venvPath}/bin/${name}` : path.join(this.venvPath, 'bin', name);
  }
}

module.exports = PythonEnvLayout;
