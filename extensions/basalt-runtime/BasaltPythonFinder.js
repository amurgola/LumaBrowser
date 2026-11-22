const CoreRequire = require('./CoreRequire');

const PythonEnvShell = CoreRequire.load('music-server/runtimes/python-env/PythonEnvShell');
const RuntimeInstallError = CoreRequire.load('shared/runtime/install/RuntimeInstallError');

class BasaltPythonFinder {
  static PROBE_TIMEOUT_MS = 15000;
  static MIN_MINOR = 10;
  static MAX_MINOR = 13;
  static PROBE_CODE = "import sys, venv, ensurepip; print('%d.%d' % sys.version_info[:2])";

  static CANDIDATES = {
    win32: [
      { command: 'py', args: ['-3.12'] }, { command: 'py', args: ['-3.11'] }, { command: 'py', args: ['-3.10'] },
      { command: 'py', args: ['-3.13'] }, { command: 'python', args: [] }, { command: 'python3', args: [] },
    ],
    linux: [
      { command: 'python3.12', args: [] }, { command: 'python3.11', args: [] }, { command: 'python3.10', args: [] },
      { command: 'python3.13', args: [] }, { command: 'python3', args: [] },
    ],
  };

  static NONE_FOUND = {
    win32: 'Basalt needs Python 3.10 to 3.13 to build its server environment, and none was found. Install Python 3.12 from python.org (with the py launcher), then install Basalt again.',
    linux: 'Basalt needs Python 3.10 to 3.13 with the venv module to build its server environment, and none was found. Install python3.12 and python3.12-venv (or your distribution\'s equivalent), then install Basalt again.',
  };

  constructor({ platform = process.platform, exec = PythonEnvShell.exec } = {}) {
    this._platform = platform;
    this._exec = exec;
  }

  async find() {
    for (const candidate of this._candidates()) {
      const version = await this._suitableVersion(candidate);
      if (version) return { ...candidate, version };
    }
    throw new RuntimeInstallError(this._noneFoundMessage(), 'PYTHON_NOT_FOUND');
  }

  _candidates() {
    return BasaltPythonFinder.CANDIDATES[this._platform] || BasaltPythonFinder.CANDIDATES.linux;
  }

  async _suitableVersion({ command, args }) {
    const result = await this._exec(command, [...args, '-I', '-c', BasaltPythonFinder.PROBE_CODE], BasaltPythonFinder.PROBE_TIMEOUT_MS);
    if (!result || !result.ok) return null;
    const version = BasaltPythonFinder.parseVersion(result.stdout);
    return version && BasaltPythonFinder.inRange(version) ? version : null;
  }

  static parseVersion(stdout) {
    const match = String(stdout || '').match(/(\d+)\.(\d+)/);
    return match ? `${match[1]}.${match[2]}` : null;
  }

  static inRange(version) {
    const [major, minor] = String(version).split('.').map(Number);
    return major === 3 && minor >= BasaltPythonFinder.MIN_MINOR && minor <= BasaltPythonFinder.MAX_MINOR;
  }

  _noneFoundMessage() {
    return BasaltPythonFinder.NONE_FOUND[this._platform] || BasaltPythonFinder.NONE_FOUND.linux;
  }
}

module.exports = BasaltPythonFinder;
