const ImageModelRecord = require('../ImageModelRecord');
const RuntimeReleaseTag = require('./RuntimeReleaseTag');

class PreferredImageRuntime {
  static pick({ model, configured, runtimes }) {
    if (!configured) return { runtime: configured, note: null, error: null };
    const { runtime, note } = PreferredImageRuntime._choose(model, configured, runtimes);
    return { runtime, note, error: PreferredImageRuntime._tooOldRefusal(model, runtime) };
  }

  static interchangeable(a, b) {
    const aliases = ImageModelRecord.RUNTIME_ALIASES;
    return (aliases[a] || []).includes(b) || (aliases[b] || []).includes(a);
  }

  static _choose(model, configured, runtimes) {
    const wanted = model && Array.isArray(model.preferredRuntimes) ? model.preferredRuntimes : [];
    let skipped = null;
    for (const id of wanted) {
      if (id === configured.id) break;
      if (!PreferredImageRuntime.interchangeable(configured.id, id)) continue;
      const row = (runtimes || []).find((r) => r && r.id === id && r.installed && r.binaryPath);
      if (!row) continue;
      if (!PreferredImageRuntime._tooOld(model, row)) return { runtime: row, note: `runtime ${row.id} preferred over ${configured.id}` };
      skipped = skipped || `runtime ${row.id} ${RuntimeReleaseTag.installedTag(row)} skipped, older than the ${PreferredImageRuntime._minimumFor(model, row)} this model needs`;
    }
    return { runtime: configured, note: skipped };
  }

  static _tooOldRefusal(model, runtime) {
    if (!PreferredImageRuntime._tooOld(model, runtime)) return null;
    const name = runtime.name || runtime.id;
    const modelName = (model && (model.label || model.id)) || 'This model';
    return `${modelName} needs the image runtime ${name} ${PreferredImageRuntime._minimumFor(model, runtime)} or newer, `
      + `and the installed build is ${RuntimeReleaseTag.installedTag(runtime)}. `
      + `Update the image runtime in Setup, Image, Image runtimes, then try again.`;
  }

  static _tooOld(model, runtime) {
    const minimum = PreferredImageRuntime._minimumFor(model, runtime);
    return !!minimum && RuntimeReleaseTag.isOlder(RuntimeReleaseTag.installedTag(runtime), minimum);
  }

  static _minimumFor(model, runtime) {
    const minimums = model && model.minRuntimeTags;
    return (runtime && minimums && typeof minimums[runtime.id] === 'string') ? minimums[runtime.id] : null;
  }
}

module.exports = PreferredImageRuntime;
