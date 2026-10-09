class SysdepsReport {
  static ALL_PRESENT_MESSAGE = 'All required system libraries are installed.';

  static aptLineFor(packages) {
    const list = Array.from(new Set((packages || []).filter(Boolean)));
    return list.length ? `sudo apt install ${list.join(' ')}` : null;
  }

  static describeMissing(missing) {
    if (!missing || missing.length === 0) return SysdepsReport.ALL_PRESENT_MESSAGE;
    const named = missing.map((entry) => entry.pkg || entry.soname);
    const subject = named.length === 1 ? 'One system library is' : `${named.length} system libraries are`;
    return `${subject} missing: ${named.join(', ')}. `
      + 'Run the command below in a terminal, then click Check again.';
  }

  static build(missing, rawLog, extra = {}, platform = process.platform) {
    const packages = Array.from(new Set(missing.map((entry) => entry.pkg).filter(Boolean)));
    return {
      ok: missing.length === 0,
      platform,
      missing,
      packages,
      aptLine: SysdepsReport.aptLineFor(packages),
      message: SysdepsReport.describeMissing(missing),
      rawLog: rawLog || '',
      ...extra,
    };
  }

  static notApplicable(reason, platform = process.platform) {
    return {
      ok: true,
      platform,
      missing: [],
      packages: [],
      aptLine: null,
      message: SysdepsReport.ALL_PRESENT_MESSAGE,
      rawLog: '',
      skipped: reason || 'not-linux',
    };
  }

  static merge(results, platform = process.platform) {
    const bySoname = new Map();
    const logs = [];
    for (const result of results) {
      if (!result) continue;
      SysdepsReport._collectMissing(bySoname, result.missing || []);
      if (result.rawLog) logs.push(result.rawLog);
    }
    return SysdepsReport.build(Array.from(bySoname.values()), logs.join('\n'), {}, platform);
  }

  static _collectMissing(bySoname, missing) {
    for (const entry of missing) {
      const known = bySoname.get(entry.soname);
      if (!known || (!known.pkg && entry.pkg)) bySoname.set(entry.soname, entry);
    }
  }
}

module.exports = SysdepsReport;
