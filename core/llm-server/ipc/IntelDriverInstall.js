const fs = require('fs');
const IntelComputeRuntime = require('../../shared/runtime/detect/IntelComputeRuntime');
const IntelDriverPlan = require('../../shared/runtime/detect/IntelDriverPlan');
const LinuxDistro = require('../../shared/runtime/detect/LinuxDistro');
const TerminalCommandRunner = require('../../shared/runtime/install/TerminalCommandRunner');
const NpuProbe = require('../diagnostics/NpuProbe');

class IntelDriverInstall {
  static GROUP_FILE = '/etc/group';
  static RENDER_GROUP = 'render';
  static TITLE = 'LumaBrowser: Intel driver install';

  constructor({ llmServerService, probes = {}, terminal = null, platform = process.platform, proc = process, fsLike = fs, log = console } = {}) {
    this._svc = llmServerService;
    this._probeIntel = probes.intel || ((opts) => IntelComputeRuntime.probe(opts));
    this._probeDistro = probes.distro || ((opts) => LinuxDistro.probe(opts));
    this._terminal = terminal || new TerminalCommandRunner({ platform });
    this._platform = platform;
    this._proc = proc;
    this._fs = fsLike;
    this._log = log;
  }

  async plan() {
    const diagnostics = await this._svc.ensureDiagnostics();
    return { plan: this._build(diagnostics) };
  }

  async install() {
    const { plan } = await this.plan();
    if (!plan.applicable || !plan.command) {
      return { ran: false, ok: false, code: null, terminal: null, error: plan.applicable ? IntelDriverInstall._manualOnly(plan) : plan.reason, plan };
    }
    this._log.log(`[llm-server] driver install in a terminal: ${plan.command}`);
    const result = await this._terminal.run(plan.command, { title: IntelDriverInstall.TITLE });
    if (!result.ok) return { ran: true, ...result, plan };
    await this._reprobe();
    const after = await this.plan();
    return { ran: true, ...result, plan: after.plan };
  }

  _build(diagnostics) {
    const platform = this._platform;
    return IntelDriverPlan.build({
      intel: this._probeIntel({ platform, fsLike: this._fs }),
      distro: this._probeDistro({ platform, fsLike: this._fs }),
      hasIntelGpu: IntelDriverInstall._hasIntelGpu(diagnostics),
      hasIntelNpu: NpuProbe.hasIntelNpu(diagnostics && diagnostics.npu),
      renderGroupMember: this._renderGroupMember(),
    });
  }

  async _reprobe() {
    try { await this._svc.ensureDiagnostics({ force: true }); } catch (err) { this._log.warn(`[llm-server] re-probe after driver install failed: ${err.message}`); }
    try { this._svc.invalidateRuntimesCache(); } catch (_) {}
  }

  static _hasIntelGpu(diagnostics) {
    const adapters = diagnostics && diagnostics.gpu && diagnostics.gpu.adapters;
    return Array.isArray(adapters) && adapters.some((a) => a && a.vendor === 'Intel');
  }

  static _manualOnly(plan) {
    return `Nothing can be installed automatically here: ${plan.notes.join(' ')}`.trim();
  }

  _renderGroupMember() {
    if (this._platform !== 'linux' || typeof this._proc.getgroups !== 'function') return null;
    try {
      const line = String(this._fs.readFileSync(IntelDriverInstall.GROUP_FILE, 'utf8')).split(/\r?\n/)
        .find((l) => l.startsWith(`${IntelDriverInstall.RENDER_GROUP}:`));
      if (!line) return null;
      const gid = Number(line.split(':')[2]);
      if (!Number.isInteger(gid)) return null;
      return this._proc.getgroups().includes(gid);
    } catch (_) {
      return null;
    }
  }
}

module.exports = IntelDriverInstall;
