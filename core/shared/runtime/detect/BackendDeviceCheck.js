const fs = require('fs');
const path = require('path');
const SysdepsCommandRunner = require('../SysdepsCommandRunner');
const RuntimeSpawnEnv = require('../server/RuntimeSpawnEnv');

class BackendDeviceCheck {
  static TIMEOUT_MS = 20000;
  static ERROR_TAIL_CHARS = 600;
  static LINE = /^\s*([A-Za-z][\w.-]*?\d+):\s+(.+?)\s*$/;
  static MEMORY = /\s*\(\d+\s*MiB,\s*\d+\s*MiB free\)\s*$/;
  static SOFTWARE = /llvmpipe|lavapipe|swiftshader|softpipe/i;
  static OPENVINO_SELECTED = /\(selected\)/;

  static async run({ binaryPath, entry, platform = process.platform, exec = SysdepsCommandRunner.run, sysdeps = null, fsLike = fs } = {}) {
    if (!binaryPath || !entry || !entry.backendDevice) return null;
    const spawn = RuntimeSpawnEnv.build(binaryPath, { platform, extraEnv: entry.spawnEnv || null });
    const result = await exec(binaryPath, ['--list-devices'], { cwd: spawn.cwd, env: spawn.env, timeout: BackendDeviceCheck.TIMEOUT_MS });
    if (BackendDeviceCheck._timedOut(result)) return { checked: false, ok: null, devices: [], error: 'device listing timed out' };
    const devices = BackendDeviceCheck.parse(`${result.stdout || ''}\n${result.stderr || ''}`);
    const report = BackendDeviceCheck._judge(entry, devices, result);
    if (!report.ok) report.error = await BackendDeviceCheck._explain(report.error, { binaryPath, entry, platform, sysdeps, fsLike });
    return report;
  }

  static parse(text) {
    const devices = [];
    for (const line of String(text || '').split(/\r?\n/)) {
      const match = BackendDeviceCheck.LINE.exec(line);
      if (!match) continue;
      const name = match[2].replace(BackendDeviceCheck.MEMORY, '').trim();
      devices.push({ id: match[1], name, software: BackendDeviceCheck.SOFTWARE.test(name) });
    }
    return devices;
  }

  static _judge(entry, devices, result) {
    const prefix = String(entry.backendDevice).toLowerCase();
    const own = devices.filter((d) => d.id.toLowerCase().startsWith(prefix));
    const real = own.filter((d) => !d.software);
    const selected = prefix === 'openvino' ? real.filter((d) => BackendDeviceCheck.OPENVINO_SELECTED.test(d.name)) : real;
    const base = { checked: true, devices };
    if (selected.length > 0) return { ...base, ok: true, error: null };
    if (!result.ok && devices.length === 0) {
      return { ...base, ok: false, error: `llama-server --list-devices exited with ${result.code}${BackendDeviceCheck._tail(result.stderr)}` };
    }
    if (prefix === 'openvino' && real.length > 0) {
      const wanted = (entry.spawnEnv && entry.spawnEnv.GGML_OPENVINO_DEVICE) || 'GPU';
      return { ...base, ok: false, error: `OpenVINO found no ${wanted} device; it listed only ${real.map((d) => d.name).join('; ')}.` };
    }
    const listed = real.length === 0 && devices.length > 0 ? ` (listed: ${devices.map((d) => d.id).join(', ')})` : '';
    return { ...base, ok: false, error: `the ${entry.backendDevice} backend listed no device${listed}${BackendDeviceCheck._tail(result.stderr)}` };
  }

  static async _explain(error, { binaryPath, entry, platform, sysdeps, fsLike }) {
    if (platform !== 'linux' || !entry.backendLib || !sysdeps || typeof sysdeps.checkBinary !== 'function') return error;
    const lib = path.join(path.dirname(binaryPath), `libggml-${entry.backendLib}.so`);
    try {
      if (!fsLike.existsSync(lib)) return error;
      const report = await sysdeps.checkBinary(lib);
      if (!report || report.ok || !Array.isArray(report.missing) || report.missing.length === 0) return error;
      const names = report.missing.map((m) => (m.pkg || m.hint ? `${m.soname} (${m.pkg || m.hint})` : m.soname));
      return `${error}; libggml-${entry.backendLib}.so cannot find ${names.join(', ')}`;
    } catch (_) {
      return error;
    }
  }

  static _timedOut(result) {
    return !!result && !result.ok && result.killed === true;
  }

  static _tail(stderr) {
    const text = String(stderr || '').trim();
    if (!text) return '';
    const last = text.split(/\r?\n/).filter((l) => l.trim()).slice(-3).join(' | ');
    return `: ${last.slice(-BackendDeviceCheck.ERROR_TAIL_CHARS)}`;
  }
}

module.exports = BackendDeviceCheck;
