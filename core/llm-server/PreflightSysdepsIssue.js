class PreflightSysdepsIssue {
  static async collect(sysdeps, services) {
    if (!sysdeps || typeof sysdeps.preflight !== 'function') return null;
    const binaries = await PreflightSysdepsIssue._installedBinaries(services);
    let result = null;
    try { result = await sysdeps.preflight({ binaries }); } catch (_) { return null; }
    if (!result || result.ok) return null;
    return PreflightSysdepsIssue._issue(result);
  }

  static async _installedBinaries(services) {
    const binaries = [];
    for (const service of services) {
      if (!service || typeof service.ensureRuntimesView !== 'function') continue;
      let view = null;
      try { view = await service.ensureRuntimesView(); } catch (_) { continue; }
      for (const runtime of (view && view.runtimes) || []) {
        if (runtime && runtime.installed && runtime.binaryPath) binaries.push(runtime.binaryPath);
      }
    }
    return binaries;
  }

  static _issue(result) {
    return {
      id: 'system-libs-missing',
      area: 'system',
      severity: 'error',
      title: 'Some system libraries are missing',
      detail: result.message,
      fix: {
        kind: 'sysdeps',
        aptLine: result.aptLine,
        packages: result.packages,
        missing: result.missing.map((m) => ({ soname: m.soname, pkg: m.pkg || null })),
      },
    };
  }
}

module.exports = PreflightSysdepsIssue;
