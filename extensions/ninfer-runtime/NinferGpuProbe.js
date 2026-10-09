const NinferShell = require('./NinferShell');

class NinferGpuProbe {
  static GPU_NAME_RE = /RTX 5090/i;
  static QUERY = 'nvidia-smi --query-gpu=index,name,memory.total --format=csv,noheader,nounits';

  static async probe(mode, distro) {
    const r = await NinferShell.run(mode, distro, NinferGpuProbe.QUERY, { timeout: NinferShell.PROBE_TIMEOUT_MS });
    if (!r.ok) return null;
    const devices = NinferGpuProbe.parseRows(r.stdout);
    return { devices, match: devices.find((d) => NinferGpuProbe.GPU_NAME_RE.test(d.name || '')) || null };
  }

  static parseRows(stdout) {
    return String(stdout || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
      const [index, name, mem] = l.split(',').map((s) => s.trim());
      return { index: Number(index), name, vramBytes: (Number(mem) || 0) * 1024 * 1024 };
    });
  }
}

module.exports = NinferGpuProbe;
