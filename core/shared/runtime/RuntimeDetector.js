const BinaryRuntimeProbe = require('./detect/BinaryRuntimeProbe');
const ExtensionRuntimeProbe = require('./detect/ExtensionRuntimeProbe');
const RuntimeDetailFields = require('./detect/RuntimeDetailFields');
const VersionProbe = require('./detect/VersionProbe');
const ManagedDir = require('./install/ManagedDir');

class RuntimeDetector {
  constructor({ catalog, expectedKind } = {}) {
    if (!catalog || typeof catalog.getCatalog !== 'function') throw new Error('RuntimeDetector requires a catalog');
    if (!expectedKind) throw new Error('RuntimeDetector requires an expectedKind');
    this._catalog = catalog;
    this._expectedKind = expectedKind;
  }

  get expectedKind() {
    return this._expectedKind;
  }

  async detectRuntimes({ runtimesRoot, cuda, gpu, manualBinaries } = {}) {
    const entries = this._catalog.getCatalog();
    const detectedById = new Map();
    const results = [];
    for (const entry of this._detectableEntries(entries)) {
      const detail = await this._detectEntry(entry, { runtimesRoot, cuda, gpu, manualBinaries });
      results.push(detail);
      detectedById.set(entry.id, detail);
    }
    this._rollUp({ entries, detectedById, results });
    return { runtimesRoot, platformKey: `${process.platform}-${process.arch}`, runtimes: results };
  }

  parseVersionOutput(stdout, stderr) {
    throw new Error(`${this.constructor.name} must implement parseVersionOutput(stdout, stderr)`);
  }

  readVersion(binaryPath) {
    return VersionProbe.read(binaryPath, (stdout, stderr) => this.parseVersionOutput(stdout, stderr));
  }

  _decorateDetail(detail, entry) {
  }

  _rollUp({ entries, detectedById, results }) {
  }

  _detectableEntries(entries) {
    return entries.filter((entry) => entry.kind === this._expectedKind
      && (!Array.isArray(entry.platforms) || entry.platforms.includes(process.platform)));
  }

  async _detectEntry(entry, { runtimesRoot, cuda, gpu, manualBinaries }) {
    const manualBinaryPath = (manualBinaries && manualBinaries[entry.id]) || null;
    const hooks = this._extensionHooksFor(entry);
    const detail = await this._probeFor(entry, { runtimesRoot, manualBinaryPath, hooks }).detect({ cuda, gpu });
    RuntimeDetailFields.stamp(detail, { entry, catalog: this._catalog, manualBinaryPath, hooks, cuda, gpu });
    this._decorateDetail(detail, entry);
    return detail;
  }

  _probeFor(entry, { runtimesRoot, manualBinaryPath, hooks }) {
    const managedDir = ManagedDir.pathFor(runtimesRoot, entry.id);
    if (hooks && typeof hooks.detect === 'function') {
      return new ExtensionRuntimeProbe({ entry, runtimesRoot, managedDir, hooks });
    }
    return new BinaryRuntimeProbe({
      binaryNames: this._catalog.getBinaryNames(entry),
      managedDir,
      manualBinaryPath,
      readVersion: (binaryPath) => this.readVersion(binaryPath),
    });
  }

  _extensionHooksFor(entry) {
    if (entry.acquisition !== 'extension' || typeof this._catalog.getExtensionHooks !== 'function') return null;
    return this._catalog.getExtensionHooks(entry.id) || null;
  }
}

module.exports = RuntimeDetector;
