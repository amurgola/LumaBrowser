const { spawn } = require('child_process');

class EditorCliRunner {
  static TIMEOUT_MS = 120 * 1000;
  static MAX_OUTPUT_CHARS = 8000;
  static MAX_LINE_CHARS = 300;
  static NOISE_LINE = /DeprecationWarning|--trace-deprecation/;

  static run(cliPath, args, { platform = process.platform, timeoutMs = EditorCliRunner.TIMEOUT_MS } = {}) {
    return new Promise((resolve) => {
      let child;
      try {
        child = EditorCliRunner._spawn(cliPath, args, platform);
      } catch (e) {
        resolve({ code: -1, output: (e && e.message) || 'could not start the editor CLI' });
        return;
      }
      EditorCliRunner._collect(child, timeoutMs, resolve);
    });
  }

  static lastMeaningfulLine(output) {
    const lines = String(output || '').split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !EditorCliRunner.NOISE_LINE.test(line));
    return lines.length ? lines[lines.length - 1].slice(0, EditorCliRunner.MAX_LINE_CHARS) : '';
  }

  static _spawn(cliPath, args, platform) {
    const env = EditorCliRunner._childEnv();
    if (platform !== 'win32') return spawn(cliPath, args, { env });
    const line = [cliPath, ...args].map((a) => `"${String(a).replace(/"/g, '')}"`).join(' ');
    return spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `"${line}"`], { env, windowsHide: true, windowsVerbatimArguments: true });
  }

  static _childEnv() {
    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE;
    return env;
  }

  static _collect(child, timeoutMs, resolve) {
    let output = '';
    const take = (data) => { if (output.length < EditorCliRunner.MAX_OUTPUT_CHARS) output += data.toString('utf8'); };
    child.stdout.on('data', take);
    child.stderr.on('data', take);
    const timer = setTimeout(() => {
      try { child.kill(); } catch (_) {}
      resolve({ code: -1, output: `${output}\n(timed out)` });
    }, timeoutMs);
    child.on('error', (e) => { clearTimeout(timer); resolve({ code: -1, output: (e && e.message) || output }); });
    child.on('close', (code) => { clearTimeout(timer); resolve({ code, output }); });
  }
}

module.exports = EditorCliRunner;
