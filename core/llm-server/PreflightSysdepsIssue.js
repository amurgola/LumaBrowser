class PreflightSysdepsIssue {
  static async collect(sysdeps, services) {
    if (!sysdeps || typeof sysdeps.preflight !== 'function') return null;
    const runtimes = await PreflightSysdepsIssue._installedRuntimes(services);
    let result = null;
    try { result = await sysdeps.preflight({ binaries: runtimes.map((r) => r.binaryPath) }); } catch (_) { return null; }
    if (!result || result.ok) return null;
    return PreflightSysdepsIssue._issue(result, await PreflightSysdepsIssue._attribute(sysdeps, runtimes));
  }

  static async _installedRuntimes(services) {
    const runtimes = [];
    for (const service of services) {
      if (!service || typeof service.ensureRuntimesView !== 'function') continue;
      let view = null;
      try { view = await service.ensureRuntimesView(); } catch (_) { continue; }
      for (const runtime of (view && view.runtimes) || []) {
        if (PreflightSysdepsIssue._checkable(runtime)) runtimes.push({ id: runtime.id, name: runtime.name || runtime.id, binaryPath: runtime.binaryPath });
      }
    }
    return runtimes;
  }

  static _checkable(runtime) {
    if (!runtime || !runtime.installed || !runtime.binaryPath) return false;
    return !(runtime.hardware && runtime.hardware.ready === false && !PreflightSysdepsIssue._backendFailed(runtime));
  }

  static _backendFailed(runtime) {
    return !!(runtime.backend && runtime.backend.checked && runtime.backend.ok === false);
  }

  static async _attribute(sysdeps, runtimes) {
    if (typeof sysdeps.checkBinary !== 'function') return [];
    const byRuntime = [];
    for (const runtime of runtimes) {
      let report = null;
      try { report = await sysdeps.checkBinary(runtime.binaryPath); } catch (_) { continue; }
      if (!report || report.ok || !Array.isArray(report.missing) || report.missing.length === 0) continue;
      byRuntime.push({ runtimeId: runtime.id, name: runtime.name, missing: report.missing.map(PreflightSysdepsIssue._entry) });
    }
    return byRuntime;
  }

  static _entry(m) {
    const entry = { soname: m.soname, pkg: m.pkg || null };
    if (m.hint) entry.hint = m.hint;
    return entry;
  }

  static _issue(result, byRuntime) {
    return {
      id: 'system-libs-missing',
      area: 'system',
      severity: 'error',
      title: 'Some system libraries are missing',
      detail: PreflightSysdepsIssue._detail(result, byRuntime),
      fix: {
        kind: 'sysdeps',
        aptLine: result.aptLine,
        packages: result.packages,
        missing: result.missing.map(PreflightSysdepsIssue._entry),
        byRuntime,
      },
    };
  }

  static _detail(result, byRuntime) {
    const lines = byRuntime.map((r) => `${r.name} needs ${r.missing.map((m) => (m.pkg || m.hint ? `${m.soname} (${m.pkg || m.hint})` : m.soname)).join(', ')}.`);
    return lines.length ? `${result.message} ${lines.join(' ')}` : result.message;
  }
}

module.exports = PreflightSysdepsIssue;
