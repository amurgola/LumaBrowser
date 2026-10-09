const { execFile } = require('child_process');

class DiagnosticsCommand {
  static TIMEOUT_MS = 4000;
  static MAX_BUFFER_BYTES = 4 * 1024 * 1024;

  static run(cmd, args, timeoutMs = DiagnosticsCommand.TIMEOUT_MS) {
    return new Promise((resolve) => {
      const settleOnce = DiagnosticsCommand._once(resolve);
      const child = execFile(cmd, args, DiagnosticsCommand._options(timeoutMs), (err, stdout, stderr) => {
        settleOnce(DiagnosticsCommand._fromCallback(cmd, err, stdout, stderr));
      });
      child.on('error', (err) => settleOnce({ ok: false, reason: DiagnosticsCommand._reason(cmd, err) }));
    });
  }

  static isBinaryMissing(reason) {
    if (!reason) return false;
    return /not found|ENOENT|cannot find/i.test(reason);
  }

  static _options(timeoutMs) {
    return { windowsHide: true, timeout: timeoutMs, maxBuffer: DiagnosticsCommand.MAX_BUFFER_BYTES };
  }

  static _fromCallback(cmd, err, stdout, stderr) {
    if (err) return { ok: false, reason: DiagnosticsCommand._reason(cmd, err) || 'exec failed', stdout: stdout || '', stderr: stderr || '' };
    return { ok: true, stdout: stdout || '', stderr: stderr || '' };
  }

  static _reason(cmd, err) {
    return err.code === 'ENOENT' ? `${cmd} not found on PATH` : err.message;
  }

  static _once(resolve) {
    let settled = false;
    return (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
  }
}

module.exports = DiagnosticsCommand;
