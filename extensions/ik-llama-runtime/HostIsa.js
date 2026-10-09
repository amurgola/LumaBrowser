const fs = require('fs');
const os = require('os');
const CpuModelIsa = require('./CpuModelIsa');

class HostIsa {
  static VARIANTS = ['avx2', 'avx512', 'avx512_vnni', 'avx512_vnni_bf16', 'avx512_vnni_vbmi', 'avx512_vnni_vbmi_bf16'];
  static ENV_OVERRIDE = 'LUMA_IK_LLAMA_ISA';
  static CPUINFO_PATH = '/proc/cpuinfo';

  static detect(opts = {}) {
    const platform = opts.platform || process.platform;
    return HostIsa._fromEnv(opts.env || process.env)
      || (platform === 'linux' ? HostIsa._fromCpuinfo(opts.cpuinfo) : null)
      || HostIsa._fromModelName(opts.cpuModel)
      || { isa: 'avx2', source: 'default', detail: 'no CPU information available' };
  }

  static fromCpuFlags(flags) {
    const f = flags instanceof Set ? flags : new Set(flags || []);
    if (!f.has('avx512f')) return 'avx2';
    if (!f.has('avx512_vnni')) return 'avx512';
    const vbmi = f.has('avx512vbmi') || f.has('avx512_vbmi');
    const bf16 = f.has('avx512_bf16');
    return `avx512_vnni${vbmi ? '_vbmi' : ''}${bf16 ? '_bf16' : ''}`;
  }

  static _fromEnv(env) {
    const override = env[HostIsa.ENV_OVERRIDE] && String(env[HostIsa.ENV_OVERRIDE]).trim().toLowerCase();
    if (!override || !HostIsa.VARIANTS.includes(override)) return null;
    return { isa: override, source: 'env', detail: HostIsa.ENV_OVERRIDE };
  }

  static _fromCpuinfo(cpuinfo) {
    const text = cpuinfo == null ? HostIsa._readCpuinfo() : cpuinfo;
    if (!text) return null;
    const line = text.split(/\r?\n/).find((l) => /^flags\s*:/i.test(l));
    if (!line) return null;
    const flags = new Set(line.split(':')[1].trim().toLowerCase().split(/\s+/));
    return { isa: HostIsa.fromCpuFlags(flags), source: 'cpuinfo', detail: '/proc/cpuinfo flags' };
  }

  static _readCpuinfo() {
    try { return fs.readFileSync(HostIsa.CPUINFO_PATH, 'utf8'); } catch (_) { return null; }
  }

  static _fromModelName(cpuModel) {
    const model = cpuModel != null ? cpuModel : ((os.cpus() || [])[0] || {}).model || '';
    if (!model) return null;
    return { isa: CpuModelIsa.fromModelName(model), source: 'model-name', detail: model.trim() };
  }
}

module.exports = HostIsa;
