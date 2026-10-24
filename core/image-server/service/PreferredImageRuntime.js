const ImageModelRecord = require('../ImageModelRecord');

class PreferredImageRuntime {
  static pick({ model, configured, runtimes }) {
    const wanted = model && Array.isArray(model.preferredRuntimes) ? model.preferredRuntimes : [];
    if (!configured) return { runtime: configured, note: null };
    for (const id of wanted) {
      if (id === configured.id) break;
      if (!PreferredImageRuntime.interchangeable(configured.id, id)) continue;
      const row = (runtimes || []).find((r) => r && r.id === id && r.installed && r.binaryPath);
      if (row) return { runtime: row, note: `runtime ${row.id} preferred over ${configured.id}` };
    }
    return { runtime: configured, note: null };
  }

  static interchangeable(a, b) {
    const aliases = ImageModelRecord.RUNTIME_ALIASES;
    return (aliases[a] || []).includes(b) || (aliases[b] || []).includes(a);
  }
}

module.exports = PreferredImageRuntime;
