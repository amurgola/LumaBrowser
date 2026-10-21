class ComputeAppsGate {
  constructor() {
    this._signature = null;
  }

  changed(rows) {
    return this._signature === null || ComputeAppsGate.signature(rows) !== this._signature;
  }

  record(rows) {
    this._signature = ComputeAppsGate.signature(rows);
  }

  reset() {
    this._signature = null;
  }

  static signature(rows) {
    return (rows || [])
      .filter((row) => row && Number.isInteger(row.index))
      .map((row) => `${row.index}:${ComputeAppsGate._usedBytes(row)}`)
      .join('|');
  }

  static _usedBytes(row) {
    if (!Number.isFinite(row.totalBytes) || !Number.isFinite(row.freeBytes)) return 'unknown';
    return Math.max(0, row.totalBytes - row.freeBytes);
  }
}

module.exports = ComputeAppsGate;
