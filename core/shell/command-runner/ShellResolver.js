const ContainerShell = require('../ContainerShell');
const DockerExec = require('../DockerExec');
const LocalShells = require('./LocalShells');

class ShellResolver {
  constructor({ platform, spawnSync, findGitBash = LocalShells.findGitBash }) {
    this._platform = platform;
    this._spawnSync = spawnSync;
    this._findGitBash = findGitBash;
    this._shells = new Map();
  }

  resolve(kind = 'auto') {
    const key = String(kind || 'auto');
    if (!this._shells.has(key)) this._shells.set(key, this._probe(key));
    return this._shells.get(key);
  }

  static forContainer(at, timeoutMs, env) {
    const inner = ContainerShell.shellFor(at.container);
    return {
      name: inner.name,
      file: DockerExec.dockerBin(),
      syntax: inner.syntax,
      argsFor: (cmd) => ContainerShell.execArgv({
        container: at.container, posixCwd: at.posix, command: cmd,
        env: { CI: '1', ...(env || {}) }, timeoutSec: timeoutMs / 1000, shell: inner,
      }),
    };
  }

  _probe(kind) {
    const windows = this._platform === 'win32';
    if (kind === 'bash') return windows ? this._gitBashOrPowerShell() : LocalShells.bash('bash');
    if (kind === 'sh') return windows ? this._windowsShell() : LocalShells.sh();
    if (kind === 'powershell') return windows ? this._windowsShell() : LocalShells.bash('bash');
    return windows ? this._windowsShell() : LocalShells.probePosix(this._spawnSync);
  }

  _gitBashOrPowerShell() {
    const gitBash = this._findGitBash();
    return gitBash ? LocalShells.bash(gitBash) : this._windowsShell();
  }

  _windowsShell() {
    return LocalShells.probeWindows(this._spawnSync);
  }
}

module.exports = ShellResolver;
