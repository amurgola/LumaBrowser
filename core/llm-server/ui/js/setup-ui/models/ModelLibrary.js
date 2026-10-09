export default class ModelLibrary {
  constructor() {
    this.scan = null;
  }

  count() {
    return (this.scan && this.scan.available && (this.scan.models || []).length) || 0;
  }

  choices() {
    if (!this.scan || !this.scan.available) return [];
    return (this.scan.models || [])
      .filter((m) => m.kind !== 'mmproj-only' && m.kind !== 'mtp-only' && m.weights && m.weights[0])
      .map((m) => ({
        path: m.weights[0].path,
        name: m.name,
        displayName: m.displayName || m.name,
        relativeDirectory: m.relativeDirectory,
        totalBytes: m.totalBytes,
        kind: m.kind,
        gguf: m.gguf,
        weightsTotalBytes: m.weightsTotalBytes,
        mmprojTotalBytes: m.mmprojTotalBytes,
        compatibleRuntimes: Array.isArray(m.compatibleRuntimes) ? m.compatibleRuntimes.slice() : [],
      }));
  }

  find(path) {
    return path ? this.choices().find((m) => m.path === path) || null : null;
  }

  static forRuntime(models, runtimeId, runtimes) {
    const selected = runtimeId ? runtimes.get(runtimeId) : null;
    const claimed = runtimes.claimedModelKinds();
    const rtKinds = selected && Array.isArray(selected.modelKinds) && selected.modelKinds.length > 0 ? selected.modelKinds : null;
    const filtered = models.filter((m) => (rtKinds ? rtKinds.includes(m.kind) : !claimed.has(m.kind)));
    return { models: filtered, locked: !!(rtKinds && filtered.length === 1), bound: !!rtKinds };
  }
}
