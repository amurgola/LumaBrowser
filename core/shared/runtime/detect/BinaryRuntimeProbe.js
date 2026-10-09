const path = require('path');
const BinaryLookup = require('../BinaryLookup');
const RuntimeManifest = require('../RuntimeManifest');
const PathBinaryLookup = require('./PathBinaryLookup');
const VersionProbe = require('./VersionProbe');

class BinaryRuntimeProbe {
  static MANAGED_SEARCH_DEPTH = 3;

  constructor({ binaryNames, managedDir, manualBinaryPath, readVersion }) {
    this._binaryNames = binaryNames;
    this._managedDir = managedDir;
    this._manualBinaryPath = manualBinaryPath || null;
    this._readVersion = readVersion;
  }

  async detect() {
    return (await this._fromManualRegistration())
      || (await this._fromManagedDir())
      || (await this._fromPath())
      || this._notInstalled();
  }

  async _fromManualRegistration() {
    const binaryPath = this._manualBinaryPath;
    if (!binaryPath || !(await BinaryLookup.pathExists(binaryPath))) return null;
    const manifest = { source: 'manual', registeredAt: null };
    return this._installed('manual', path.dirname(binaryPath), binaryPath, manifest);
  }

  async _fromManagedDir() {
    const binaryPath = await BinaryLookup.findBinaryIn(this._managedDir, this._binaryNames, { maxDepth: BinaryRuntimeProbe.MANAGED_SEARCH_DEPTH });
    if (!binaryPath) return null;
    const probe = await this._probe(binaryPath);
    const manifest = await RuntimeManifest.read(this._managedDir);
    return { installed: true, source: 'managed', managedDir: this._managedDir, binaryPath, ...probe, manifest };
  }

  async _fromPath() {
    const binaryPath = await PathBinaryLookup.find(this._binaryNames[0]);
    if (!binaryPath) return null;
    return this._installed('path', this._managedDir, binaryPath, null);
  }

  async _installed(source, managedDir, binaryPath, manifest) {
    const probe = await this._probe(binaryPath);
    return { installed: true, source, managedDir, binaryPath, ...probe, manifest };
  }

  async _probe(binaryPath) {
    return VersionProbe.normalize(await this._readVersion(binaryPath));
  }

  _notInstalled() {
    return {
      installed: false,
      source: null,
      managedDir: this._managedDir,
      binaryPath: null,
      version: null,
      probeError: null,
      manifest: null,
      staleManualRegistration: !!this._manualBinaryPath,
    };
  }
}

module.exports = BinaryRuntimeProbe;
