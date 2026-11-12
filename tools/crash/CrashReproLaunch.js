const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const CrashTracer = require('../../core/diagnostics/CrashTracer');
const RunArtifacts = require('./RunArtifacts');
const ProcessTreeKiller = require('./ProcessTreeKiller');

class CrashReproLaunch {
  static ECHO_PATTERN = /crash-trace|Restored \d+ persisted|render-process-gone|child-process-gone|FATAL|uncaught/i;
  static DRIVE_STOP_BEFORE_QUIT_MS = 1500;
  static WATCHDOG_SETTLE_MS = 3000;

  constructor({ electronPath, root, options, artifacts, interaction = null, tabDriver = null, env = process.env,
    platform = process.platform, spawnImpl = spawn, killer = ProcessTreeKiller, stdout = process.stdout }) {
    this._electron = electronPath;
    this._root = root;
    this._o = options;
    this._artifacts = artifacts;
    this._interaction = interaction;
    this._tabDriver = tabDriver;
    this._env = env;
    this._platform = platform;
    this._spawn = spawnImpl;
    this._killer = killer;
    this._stdout = stdout;
  }

  static command(electronPath, runDir) {
    return { file: electronPath, args: ['.', '--dev', '--enable-logging=file', `--log-file=${path.join(runDir, 'chromium.log')}`] };
  }

  execute(index) {
    const run = this._openRun(index);
    run.child = this._startApp(run);
    this._startHelpers(run);
    return this._awaitExit(run);
  }

  _openRun(index) {
    const runDir = path.join(this._o.outDir, `run-${String(index).padStart(2, '0')}`);
    fs.mkdirSync(runDir, { recursive: true });
    return { index, runDir, consoleLog: fs.openSync(path.join(runDir, 'console.log'), 'a'), startedAt: Date.now(), helper: null };
  }

  _startApp(run) {
    const { file, args } = CrashReproLaunch.command(this._electron, run.runDir);
    const child = this._spawn(file, args, {
      cwd: this._root,
      env: { ...this._env, [CrashTracer.AUTO_QUIT_ENV]: String(this._o.holdMs) },
      stdio: ['ignore', 'pipe', 'pipe'],
      ...ProcessTreeKiller.spawnOptions(this._platform),
    });
    const echo = (chunk) => this._echo(run, chunk);
    child.stdout.on('data', echo);
    child.stderr.on('data', echo);
    return child;
  }

  _echo(run, chunk) {
    this._writeLog(run, chunk);
    for (const line of String(chunk).split('\n')) {
      if (CrashReproLaunch.ECHO_PATTERN.test(line)) this._stdout.write(`    | ${line.trim()}\n`);
    }
  }

  _writeLog(run, text) {
    try { fs.writeSync(run.consoleLog, text); } catch (_) {}
  }

  _startHelpers(run) {
    const write = (s) => this._writeLog(run, s);
    if (this._tabDriver) {
      const stopAt = run.startedAt + this._o.holdMs - CrashReproLaunch.DRIVE_STOP_BEFORE_QUIT_MS;
      this._tabDriver.run(run.child, write, stopAt).catch(() => {});
    }
    if (this._interaction) run.helper = this._interaction.start(run.child.pid, this._o.holdMs, write);
  }

  _awaitExit(run) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (code, signal, hung) => {
        if (settled) return;
        settled = true;
        clearTimeout(watchdog);
        resolve(this._collect(run, code, signal, hung));
      };
      const watchdog = setTimeout(() => this._onHang(run, finish), this._o.holdMs + this._o.exitGraceMs);
      run.child.on('exit', (code, signal) => finish(code, signal, false));
      run.child.on('error', (err) => {
        this._stdout.write(`    | spawn error: ${err.message}\n`);
        finish(-1, null, false);
      });
    });
  }

  _onHang(run, finish) {
    this._stdout.write(`    | no exit ${this._o.exitGraceMs / 1000}s after the auto-quit deadline, killing\n`);
    this._killer.kill(run.child, { platform: this._platform });
    setTimeout(() => finish(null, 'watchdog', true), CrashReproLaunch.WATCHDOG_SETTLE_MS);
  }

  _collect(run, code, signal, hung) {
    this._stopHelper(run);
    try { fs.closeSync(run.consoleLog); } catch (_) {}
    const traceLog = this._artifacts.findTraceLog(run.child.pid, run.startedAt);
    const lines = traceLog ? RunArtifacts.readLines(traceLog) : [];
    const dumps = this._artifacts.dumpsSince(run.startedAt);
    this._copyInto(run.runDir, traceLog ? [traceLog, ...dumps] : dumps);
    return {
      index: run.index, pid: run.child.pid, code, signal, durationMs: Date.now() - run.startedAt,
      verdict: RunArtifacts.verdict({ code, hung, lines }), runDir: run.runDir, traceLog,
      ended: RunArtifacts.hasEnd(lines), dumps, lastEvent: RunArtifacts.lastEvent(lines),
    };
  }

  _stopHelper(run) {
    if (run.helper) { try { run.helper.kill(); } catch (_) {} }
  }

  _copyInto(dir, files) {
    for (const f of files) {
      try { fs.copyFileSync(f, path.join(dir, path.basename(f))); } catch (_) {}
    }
  }
}

module.exports = CrashReproLaunch;
