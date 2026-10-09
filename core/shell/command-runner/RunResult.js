class RunResult {
  static failed(message, shell) {
    const named = typeof shell === 'object' && shell ? shell : { name: String(shell || 'auto'), syntax: '' };
    return {
      ...RunResult._empty(Date.now()),
      shell: named.name,
      syntax: named.syntax,
      error: message,
    };
  }

  static finished({ exitCode, signal, timedOut, aborted, pid, startedAt, out, shell, error }) {
    return {
      exitCode: typeof exitCode === 'number' ? exitCode : null,
      signal: signal || null,
      timedOut,
      aborted,
      detached: false,
      pid: pid || null,
      logPath: out.spillPath,
      startedAt,
      ...RunResult._output(out),
      spillPath: out.spillPath,
      durationMs: Date.now() - startedAt,
      shell: shell.name,
      syntax: shell.syntax,
      error: error || null,
    };
  }

  static detached({ pid, startedAt, logPath, snap, shell }) {
    return {
      exitCode: null,
      signal: null,
      timedOut: false,
      aborted: false,
      detached: true,
      pid: pid || null,
      logPath,
      startedAt,
      ...RunResult._output(snap),
      spillPath: logPath,
      durationMs: Date.now() - startedAt,
      shell: shell.name,
      syntax: shell.syntax,
      error: null,
    };
  }

  static _output(out) {
    return { output: out.text, outputBytes: out.totalBytes, capturedBytes: out.capturedBytes };
  }

  static _empty(startedAt) {
    return {
      exitCode: null, signal: null, timedOut: false, aborted: false, detached: false, pid: null, logPath: null,
      startedAt, output: '', outputBytes: 0, capturedBytes: 0, spillPath: null, durationMs: 0,
    };
  }
}

module.exports = RunResult;
