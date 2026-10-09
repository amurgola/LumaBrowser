const os = require('os');
const path = require('path');
const childProcess = require('child_process');
const ChildProcessRegistry = require('./ChildProcessRegistry');
const ContainerPath = require('./ContainerPath');
const CommandRun = require('./command-runner/CommandRun');
const LocalShells = require('./command-runner/LocalShells');
const OutputCapture = require('./command-runner/OutputCapture');
const ProcessTreeKiller = require('./command-runner/ProcessTreeKiller');
const RunResult = require('./command-runner/RunResult');
const ShellResolver = require('./command-runner/ShellResolver');

class CommandRunner {
  static DEFAULT_TIMEOUT_MS = 120 * 1000;
  static MAX_TIMEOUT_MS = 10 * 60 * 1000;
  static MIN_TIMEOUT_MS = 1000;
  static DEFAULT_MAX_CAPTURE_BYTES = 2 * 1024 * 1024;

  constructor(opts = {}) {
    this._defaultTimeoutMs = CommandRunner._positiveOr(opts.defaultTimeoutMs, CommandRunner.DEFAULT_TIMEOUT_MS);
    this._maxTimeoutMs = CommandRunner._positiveOr(opts.maxTimeoutMs, CommandRunner.MAX_TIMEOUT_MS);
    this._maxCaptureBytes = CommandRunner._positiveOr(opts.maxCaptureBytes, CommandRunner.DEFAULT_MAX_CAPTURE_BYTES);
    this._spillDir = opts.spillDir || os.tmpdir();
    this._spawn = opts.spawn || childProcess.spawn;
    this._platform = opts.platform || process.platform;
    this._shells = new ShellResolver({ platform: this._platform, spawnSync: opts.spawnSync || childProcess.spawnSync });
    this._killer = new ProcessTreeKiller({ platform: this._platform, spawn: this._spawn });
  }

  resolveShell(kind = 'auto') {
    return this._shells.resolve(kind);
  }

  run({ command, cwd, timeoutMs, shell: shellKind = 'auto', env, onOutput, signal, detachAfterMs, conversationId = null } = {}) {
    const cmd = String(command || '').trim();
    const invalid = CommandRunner._invalid(cmd, cwd);
    if (invalid) return Promise.resolve(RunResult.failed(invalid, shellKind));
    const timeout = this._clampTimeout(timeoutMs);
    const inContainer = ContainerPath.parse(cwd);
    const shell = inContainer ? ShellResolver.forContainer(inContainer, timeout, env) : this.resolveShell(shellKind);
    const spawned = this._start(shell, cmd, cwd, env, inContainer);
    if (spawned.error) return Promise.resolve(RunResult.failed(spawned.error, shell));
    return new CommandRun({
      child: spawned.child, shell, command: cmd, cwd, timeoutMs: timeout, detachAfterMs, signal, conversationId,
      inContainer: !!inContainer, killer: this._killer,
      capture: new OutputCapture({ maxBytes: this._maxCaptureBytes, spillDir: this._spillDir, onOutput }),
    }).start();
  }

  static psScript(cmd) {
    return LocalShells.psScript(cmd);
  }

  _start(shell, cmd, cwd, env, inContainer) {
    try {
      const child = this._spawn(shell.file, shell.argsFor(cmd), {
        cwd: inContainer ? undefined : cwd,
        env: { ...process.env, CI: '1', ...(env || {}) },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
        detached: this._platform !== 'win32',
      });
      return { child: ChildProcessRegistry.track(child) };
    } catch (e) {
      return { error: `Could not start ${shell.name}: ${e.message}` };
    }
  }

  _clampTimeout(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return Math.min(this._defaultTimeoutMs, this._maxTimeoutMs);
    return Math.max(CommandRunner.MIN_TIMEOUT_MS, Math.min(n, this._maxTimeoutMs));
  }

  static _invalid(cmd, cwd) {
    if (!cmd) return 'A command is required';
    if (!cwd || !path.isAbsolute(cwd)) return 'cwd must be an absolute path';
    return null;
  }

  static _positiveOr(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  }
}

module.exports = CommandRunner;
