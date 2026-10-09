const { execFile } = require('child_process');

class SysdepsCommandRunner {
  static TIMEOUT_MS = 10 * 1000;
  static MAX_BUFFER_BYTES = 4 * 1024 * 1024;

  static run(cmd, args, options = {}) {
    return new Promise((resolve) => {
      const settleOnce = SysdepsCommandRunner._once(resolve);
      const child = execFile(cmd, args, SysdepsCommandRunner._execOptions(options), (err, stdout, stderr) => {
        settleOnce(SysdepsCommandRunner._fromCallback(err, stdout, stderr));
      });
      child.on('error', (err) => settleOnce(SysdepsCommandRunner._fromSpawnError(err)));
    });
  }

  static _execOptions(options) {
    return {
      windowsHide: true,
      timeout: SysdepsCommandRunner.TIMEOUT_MS,
      maxBuffer: SysdepsCommandRunner.MAX_BUFFER_BYTES,
      ...options,
    };
  }

  static _once(resolve) {
    let settled = false;
    return (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
  }

  static _fromCallback(err, stdout, stderr) {
    return { ok: !err, code: err ? err.code : 0, stdout: String(stdout || ''), stderr: String(stderr || '') };
  }

  static _fromSpawnError(err) {
    return { ok: false, code: err.code || 'ERR', stdout: '', stderr: err.message };
  }
}

module.exports = SysdepsCommandRunner;
