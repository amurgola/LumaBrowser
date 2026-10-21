class NvidiaSmiOutputParser {
  static MIB = 1024 * 1024;
  static GPU_ROW_MIN_FIELDS = 5;

  static parseGpuCount(stdout) {
    return (String(stdout).match(/^GPU \d+:/gm) || []).length;
  }

  static parseGpuRows(stdout) {
    const byIndex = new Map();
    for (const line of NvidiaSmiOutputParser._lines(stdout)) {
      const row = NvidiaSmiOutputParser.parseGpuRow(line);
      if (row) byIndex.set(row.index, row);
    }
    return [...byIndex.values()].sort((a, b) => a.index - b.index);
  }

  static parseGpuRow(line) {
    const parts = NvidiaSmiOutputParser._fields(line);
    if (parts.length < NvidiaSmiOutputParser.GPU_ROW_MIN_FIELDS) return null;
    const index = Number(parts[0]);
    if (!Number.isInteger(index) || index < 0) return null;
    return {
      index,
      busId: parts[1] || null,
      name: parts.slice(2, parts.length - 2).join(', '),
      totalBytes: NvidiaSmiOutputParser._mibToBytes(parts[parts.length - 2]),
      freeBytes: NvidiaSmiOutputParser._mibToBytes(parts[parts.length - 1]),
    };
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
