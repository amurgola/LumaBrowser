class CommandText {
  static head(command, n = 48) {
    const c = String(command || '');
    return c.length > n ? `${c.slice(0, n)}…` : c;
  }

  static duration(ms) {
    const s = Math.max(0, Number(ms) || 0) / 1000;
    if (s < 60) return `${s.toFixed(s < 10 ? 1 : 0)}s`;
    const m = Math.floor(s / 60);
    return `${m}m ${Math.round(s - m * 60)}s`;
  }

  static exitCodeText(e) {
    return e.exitCode == null ? (e.signal || 'unknown') : e.exitCode;
  }

  static exitNotice(e) {
    return `[System: background process ${e.pid} (${CommandText.head(e.command)}) ${CommandText._how(e)} `
      + `after ${CommandText.duration(e.durationMs)}; log at ${e.logPath || '(no log)'}]`;
  }

  static _how(e) {
    if (e.killed) return 'was killed';
    if (e.exitCode === 0) return 'finished (exit 0)';
    return `exited with code ${CommandText.exitCodeText(e)}`;
  }
}

module.exports = CommandText;
