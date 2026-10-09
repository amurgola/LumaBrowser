class NvidiaSmiOutputParser {
  static MIB = 1024 * 1024;

  static parseGpuCount(stdout) {
    return (String(stdout).match(/^GPU \d+:/gm) || []).length;
  }

  static parseGpuRows(stdout) {
    const rows = [];
    NvidiaSmiOutputParser._lines(stdout).forEach((line, index) => {
      const row = NvidiaSmiOutputParser._parseGpuRow(line, index);
      if (row) rows.push(row);
    });
    return rows;
  }

  static parseComputeApps(stdout) {
    const map = {};
    for (const line of NvidiaSmiOutputParser._lines(stdout)) {
      const [pid, mib] = NvidiaSmiOutputParser._fields(line).map(Number);
      if (Number.isInteger(pid) && Number.isFinite(mib)) {
        map[pid] = (map[pid] || 0) + mib * NvidiaSmiOutputParser.MIB;
      }
    }
    return map;
  }

  static _parseGpuRow(line, index) {
    const parts = NvidiaSmiOutputParser._fields(line);
    if (parts.length < 3) return null;
    return {
      index,
      name: parts.slice(0, parts.length - 2).join(', '),
      totalBytes: NvidiaSmiOutputParser._mibToBytes(parts[parts.length - 2]),
      freeBytes: NvidiaSmiOutputParser._mibToBytes(parts[parts.length - 1]),
    };
  }

  static _mibToBytes(text) {
    const mib = Number(text);
    return Number.isFinite(mib) ? mib * NvidiaSmiOutputParser.MIB : null;
  }

  static _lines(stdout) {
    return String(stdout).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  }

  static _fields(line) {
    return line.split(',').map((s) => s.trim());
  }
}

module.exports = NvidiaSmiOutputParser;
