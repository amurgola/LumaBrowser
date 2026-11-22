const fs = require('fs');
const CoreRequire = require('./CoreRequire');

const PythonEnvShell = CoreRequire.load('music-server/runtimes/python-env/PythonEnvShell');
const RuntimeInstallError = CoreRequire.load('shared/runtime/install/RuntimeInstallError');

class BasaltVenv {
  static VENV_TIMEOUT_MS = 5 * 60 * 1000;
  static PIP_TIMEOUT_MS = 30 * 60 * 1000;

  constructor({ layout, python, emit, canceled, run = PythonEnvShell.streamCommand }) {
    this._layout = layout;
    this._python = python;
    this._emit = emit;
    this._canceled = canceled;
    this._run = run;
  }

  async create() {
    this._removeOldVenv();
    await this._step('creating the Python environment', this._python.command, [...this._python.args, '-I', '-m', 'venv', this._layout.venvDir], BasaltVenv.VENV_TIMEOUT_MS, 'VENV_FAILED');
    await this._step('installing the Basalt server\'s Python packages', this._layout.venvPython, ['-I', '-m', 'pip', 'install', '--disable-pip-version-check', '-r', this._layout.requirementsPath], BasaltVenv.PIP_TIMEOUT_MS, 'PIP_INSTALL_FAILED');
  }

  _removeOldVenv() {
    fs.rmSync(this._layout.venvDir, { recursive: true, force: true });
  }

  async _step(label, command, args, timeout, code) {
    this._emit('extract', { phase: 'progress', label });
    const result = await this._run({
      command, args, cwd: this._layout.archiveDir, timeout, canceled: this._canceled,
      onLine: (line) => this._emit('extract', { phase: 'progress', label: line }),
    });
    if (result.canceled) throw new RuntimeInstallError('Install canceled.', 'CANCELED');
    if (!result.ok) throw new RuntimeInstallError(`Basalt install failed while ${label}: ${result.tail || 'unknown error'}`, code);
  }
}

module.exports = BasaltVenv;
