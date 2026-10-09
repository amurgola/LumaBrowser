const { execFile } = require('child_process');
const WslFormat = require('./WslFormat');

class Wsl {
  static PROBE_TIMEOUT_MS = 15000;
  static MAX_BUFFER = 4 * 1024 * 1024;
  static REASON_MAX = 500;

  static exec(args, { timeout = Wsl.PROBE_TIMEOUT_MS } = {}) {
    return new Promise((resolve) => {
      let settled = false;
      const settle = (result) => {
        if (settled) return;
        settled = true;
        resolve(result);
      };
      const options = { windowsHide: true, timeout, maxBuffer: Wsl.MAX_BUFFER, encoding: 'buffer' };
      const child = execFile('wsl.exe', args, options, (err, stdout, stderr) => settle(Wsl._toResult(err, stdout, stderr)));
      child.on('error', (err) => settle({ ok: false, stdout: '', stderr: '', reason: err.message }));
    });
  }

  static runInWsl(distro, command, { timeout = Wsl.PROBE_TIMEOUT_MS } = {}) {
    const target = distro ? ['-d', distro] : [];
    return Wsl.exec([...target, '--', 'bash', '-lc', command], { timeout });
  }

  static async detect() {
    if (process.platform !== 'win32') return Wsl._notReady(false, 'Not a Windows host.');
    const listing = await Wsl.exec(['-l', '-v'], { timeout: Wsl.PROBE_TIMEOUT_MS });
    if (!listing.ok) return Wsl._notReady(false, listing.reason || 'WSL not installed.');
    const rows = WslFormat.parseList(listing.stdout);
    const v2 = rows.filter((row) => row.version === 2);
    if (v2.length === 0) return Wsl._notReady(true, Wsl._noWsl2Note(rows));
    const distro = (v2.find((row) => row.isDefault) || v2[0]).name;
    const nvidiaDriverOk = await Wsl._hasNvidiaGpu(distro);
    return {
      present: true,
      wsl2: true,
      distro,
      nvidiaDriverOk,
      note: nvidiaDriverOk ? null : 'nvidia-smi failed inside WSL. Install or update the NVIDIA driver with WSL support on Windows.',
    };
  }

  static killPortInWsl(distro, port, { timeout = Wsl.PROBE_TIMEOUT_MS, pattern } = {}) {
    return Wsl.runInWsl(distro, WslFormat.killPortCommand(port, pattern), { timeout });
  }

  static _toResult(err, stdout, stderr) {
    const out = WslFormat.decodeOutput(stdout);
    const errOut = WslFormat.decodeOutput(stderr);
    if (!err) return { ok: true, stdout: out, stderr: errOut, reason: null };
    const reason = err.code === 'ENOENT' ? 'wsl.exe not found' : (errOut || err.message || 'wsl exec failed').slice(0, Wsl.REASON_MAX);
    return { ok: false, stdout: out, stderr: errOut, reason };
  }

  static async _hasNvidiaGpu(distro) {
    const smi = await Wsl.runInWsl(distro, 'nvidia-smi -L', { timeout: Wsl.PROBE_TIMEOUT_MS });
    return smi.ok && /GPU \d+:/.test(smi.stdout);
  }

  static _noWsl2Note(rows) {
    return rows.length > 0
      ? 'Only WSL1 distros found. GPU passthrough needs WSL2 (wsl --set-version <distro> 2).'
      : 'No WSL distros installed. Run: wsl --install';
  }

  static _notReady(present, note) {
    return { present, wsl2: false, distro: null, nvidiaDriverOk: false, note };
  }
}

module.exports = Wsl;
