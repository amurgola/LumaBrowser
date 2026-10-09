const SysdepsChecker = require('../../shared/runtime/SysdepsChecker');

class SystemLibrariesCheck {
  constructor({ llmServerService, deps, sysdeps = new SysdepsChecker(), log = console }) {
    this._svc = llmServerService;
    this._deps = deps;
    this._sysdeps = sysdeps;
    this._log = log;
  }

  async check() {
    const binaries = await this._installedBinaries();
    const res = await this._sysdeps.preflight({ binaries });
    if (!res.ok) this._log.warn(`[llm-server] system libraries missing: ${res.packages.join(', ')}\n${res.rawLog || ''}`);
    const { rawLog, ...result } = res;
    return { result };
  }

  async _installedBinaries() {
    const binaries = [];
    for (const service of [this._svc, this._deps.imageServerService()]) {
      if (service) binaries.push(...await SystemLibrariesCheck._binariesOf(service));
    }
    return binaries;
  }

  static async _binariesOf(service) {
    try {
      const view = await service.ensureRuntimesView();
      return ((view && view.runtimes) || []).filter((r) => r && r.installed && r.binaryPath).map((r) => r.binaryPath);
    } catch (_) {
      return [];
    }
  }
}

module.exports = SystemLibrariesCheck;
