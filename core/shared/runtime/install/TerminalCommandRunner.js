const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const PathBinaryLookup = require('../detect/PathBinaryLookup');

class TerminalCommandRunner {
  static TERMINALS = Object.freeze([
    { name: 'konsole', args: (script) => ['-e', script] },
    { name: 'gnome-terminal', args: (script) => ['--wait', '--', script] },
    { name: 'ptyxis', args: (script) => ['--', script] },
    { name: 'xfce4-terminal', args: (script) => ['-e', script] },
    { name: 'tilix', args: (script) => ['-e', script] },
    { name: 'mate-terminal', args: (script) => ['-e', script] },
    { name: 'lxterminal', args: (script) => ['-e', script] },
    { name: 'kitty', args: (script) => [script] },
    { name: 'alacritty', args: (script) => ['-e', script] },
    { name: 'wezterm', args: (script) => ['start', '--', script] },
    { name: 'foot', args: (script) => [script] },
    { name: 'x-terminal-emulator', args: (script) => ['-e', script] },
    { name: 'xterm', args: (script) => ['-e', script] },
  ]);
  static POLL_MS = 500;
  static TIMEOUT_MS = 30 * 60 * 1000;
  static START_GRACE_MS = 3000;
  static CLOSED_CODE = 130;
  static NO_TERMINAL = 'No terminal emulator was found (looked for konsole, gnome-terminal, xfce4-terminal, kitty, alacritty, foot, xterm and others). Run the command yourself in a terminal.';

  constructor({
    spawnFn = spawn, fsLike = fs, tmpDir = os.tmpdir(), env = process.env, find = PathBinaryLookup.find,
    platform = process.platform, pollMs = TerminalCommandRunner.POLL_MS, timeoutMs = TerminalCommandRunner.TIMEOUT_MS,
    startGraceMs = TerminalCommandRunner.START_GRACE_MS, setTimeoutFn = setTimeout,
  } = {}) {
    this._spawn = spawnFn;
    this._fs = fsLike;
    this._tmpDir = tmpDir;
    this._env = env;
    this._find = find;
    this._platform = platform;
    this._pollMs = pollMs;
    this._timeoutMs = timeoutMs;
    this._startGraceMs = startGraceMs;
    this._setTimeout = setTimeoutFn;
  }

  async run(command, { title = 'LumaBrowser' } = {}) {
    if (this._platform !== 'linux') return TerminalCommandRunner._failure(null, 'Terminal runs are only supported on Linux.');
    const terminal = await this._findTerminal();
    if (!terminal) return TerminalCommandRunner._failure(null, TerminalCommandRunner.NO_TERMINAL);
    const files = this._writeScript(command, title);
    const child = this._launch(terminal, files.script);
    if (!child) return TerminalCommandRunner._failure(terminal.name, `${terminal.name} could not be started.`);
    const result = await this._await(child, files, terminal.name);
    this._cleanup(files.dir);
    return result;
  }

  static script(command, { status, started, title }) {
    const q = TerminalCommandRunner.quote;
    return [
      '#!/usr/bin/env bash',
      `STATUS=${q(status)}`,
      'CODE=130',
      ': > ' + q(started),
      'trap \'echo "$CODE" > "$STATUS"\' EXIT',
      `echo ${q(`== ${title} ==`)}`,
      "echo 'Running:'",
      `echo ${q(`  ${command}`)}`,
      'echo',
      command,
      'CODE=$?',
      'echo',
      'if [ "$CODE" -eq 0 ]; then echo \'Finished successfully. You can close this window.\'; else echo "The command exited with code $CODE."; fi',
      'echo "$CODE" > "$STATUS"',
      "read -r -p 'Press Enter to close this window... ' _ || true",
      '',
    ].join('\n');
  }

  static quote(text) {
    return `'${String(text).replace(/'/g, "'\\''")}'`;
  }

  async _findTerminal() {
    const preferred = this._env && this._env.TERMINAL ? String(this._env.TERMINAL).trim() : '';
    if (preferred) {
      const found = await this._find(preferred, this._env, this._platform);
      if (found) return { name: preferred, path: found, args: (script) => ['-e', script] };
    }
    for (const terminal of TerminalCommandRunner.TERMINALS) {
      const found = await this._find(terminal.name, this._env, this._platform);
      if (found) return { ...terminal, path: found };
    }
    return null;
  }

  _writeScript(command, title) {
    const join = path.posix.join;
    const dir = this._fs.mkdtempSync(join(this._tmpDir, 'luma-terminal-'));
    const files = { dir, script: join(dir, 'run.sh'), status: join(dir, 'status'), started: join(dir, 'started') };
    this._fs.writeFileSync(files.script, TerminalCommandRunner.script(command, { ...files, title }), { mode: 0o755 });
    return files;
  }

  _launch(terminal, script) {
    try {
      const child = this._spawn(terminal.path, terminal.args(script), { detached: true, stdio: 'ignore', env: this._env });
      if (child && typeof child.unref === 'function') child.unref();
      return child || null;
    } catch (_) {
      return null;
    }
  }

  _await(child, files, name) {
    return new Promise((resolve) => {
      let settled = false;
      let exited = null;
      const finish = (value) => { if (!settled) { settled = true; resolve(value); } };
      const deadline = Date.now() + this._timeoutMs;
      child.on('error', (err) => finish(TerminalCommandRunner._failure(name, `${name} failed to start: ${err.message}`)));
      child.on('exit', (code) => { exited = { at: Date.now(), code }; });
      const poll = () => {
        if (settled) return;
        const code = this._readStatus(files.status);
        if (code !== null) return finish(TerminalCommandRunner._outcome(name, code));
        if (exited && !this._exists(files.started) && Date.now() - exited.at >= this._startGraceMs) {
          return finish(TerminalCommandRunner._failure(name, `${name} exited (code ${exited.code}) before the command ran.`));
        }
        if (Date.now() >= deadline) return finish(TerminalCommandRunner._failure(name, 'Timed out waiting for the terminal to finish.'));
        this._setTimeout(poll, this._pollMs);
      };
      poll();
    });
  }

  _readStatus(file) {
    try {
      const text = String(this._fs.readFileSync(file, 'utf8')).trim();
      if (!/^-?\d+$/.test(text)) return null;
      return Number(text);
    } catch (_) {
      return null;
    }
  }

  _exists(file) {
    try { return this._fs.existsSync(file); } catch (_) { return false; }
  }

  _cleanup(dir) {
    try { this._fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
  }

  static _outcome(terminal, code) {
    if (code === 0) return { ok: true, code, terminal, error: null };
    const closed = code === TerminalCommandRunner.CLOSED_CODE;
    return { ok: false, code, terminal, error: closed ? 'The terminal window was closed before the command finished.' : `The command exited with code ${code}.` };
  }

  static _failure(terminal, error) {
    return { ok: false, code: null, terminal, error };
  }
}

module.exports = TerminalCommandRunner;
