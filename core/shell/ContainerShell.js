const DockerExec = require('./DockerExec');

class ContainerShell {
  static PROBE_TIMEOUT_MS = 15000;
  static BASH = Object.freeze({ name: 'bash', file: 'bash', syntax: 'bash (Linux container)' });
  static SH = Object.freeze({ name: 'sh', file: 'sh', syntax: 'sh (Linux container)' });

  static TIMEOUT_GUARD = 'if command -v timeout >/dev/null 2>&1; then exec timeout -s KILL "$0" "$@"; else exec "$@"; fi';

  static _shells = new Map();

  static shellFor(container) {
    if (!ContainerShell._shells.has(container)) ContainerShell._shells.set(container, ContainerShell._probe(container));
    return ContainerShell._shells.get(container);
  }

  static execArgv({ container, posixCwd, command, env, timeoutSec, shell }) {
    const args = ['exec', '-w', posixCwd, ...ContainerShell._envArgs(env)];
    const seconds = String(Math.max(1, Math.ceil(timeoutSec)));
    args.push(container, 'sh', '-c', ContainerShell.TIMEOUT_GUARD, seconds, shell.file, '-c', command);
    return args;
  }

  static reset() {
    ContainerShell._shells.clear();
  }

  static _probe(container) {
    const hasBash = DockerExec.exec(container, ['bash', '-c', 'exit 0'], { timeoutMs: ContainerShell.PROBE_TIMEOUT_MS }).status === 0;
    return hasBash ? ContainerShell.BASH : ContainerShell.SH;
  }

  static _envArgs(env) {
    return Object.entries(env || {}).flatMap(([key, value]) => ['-e', `${key}=${value}`]);
  }
}

module.exports = ContainerShell;
