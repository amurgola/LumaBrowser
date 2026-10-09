const fs = require('fs');
const BinaryLookup = require('../../shared/runtime/BinaryLookup');
const PathPicker = require('../../shared/ipc/PathPicker');
const RuntimeUpdateChecker = require('../../shared/runtime/RuntimeUpdateChecker');
const ImageRuntimeCatalog = require('../runtimes/ImageRuntimeCatalog');
const ImageRuntimeInstaller = require('../runtimes/ImageRuntimeInstaller');

class ImageRuntimeSetup {
  static KIND = 'image-inference';

  constructor({ imageServerService, installer = ImageRuntimeInstaller.shared, catalog = new ImageRuntimeCatalog(), pickPath = PathPicker.pick }) {
    this._svc = imageServerService;
    this._installer = installer;
    this._catalog = catalog;
    this._pickPath = pickPath;
    this._updateCache = new Map();
  }

  async view(opts) {
    return { view: await this._svc.ensureRuntimesView({ force: !!(opts && opts.force) }) };
  }

  async checkUpdates() {
    const view = await this._svc.ensureRuntimesView();
    const updates = await RuntimeUpdateChecker.check({
      view,
      kind: ImageRuntimeSetup.KIND,
      fetchLatestRelease: (repo) => this._installer.fetchLatestRelease(repo),
      cache: this._updateCache,
    });
    return { updates };
  }

  async locate(event, runtimeId) {
    if (!runtimeId) throw new Error('runtimeId is required');
    const entry = this._catalog.getById(runtimeId);
    if (!entry) throw new Error(`Unknown runtime: ${runtimeId}`);
    const picked = await this._pickPath(event, { title: `Locate the folder containing ${entry.name}`, properties: ['openDirectory'] });
    if (picked.canceled) return { success: true, canceled: true };
    const dir = picked.paths[0];
    const binaryPath = await this._findBinary(entry, dir);
    this._svc.setManualRuntimeBinary(runtimeId, binaryPath);
    return { binaryPath, dir };
  }

  async register(runtimeId, binaryPath) {
    if (!runtimeId) throw new Error('runtimeId is required');
    if (!binaryPath) {
      this._svc.setManualRuntimeBinary(runtimeId, null);
      return { cleared: true };
    }
    await ImageRuntimeSetup._assertAccessible(binaryPath);
    this._svc.setManualRuntimeBinary(runtimeId, binaryPath);
    return {};
  }

  async install(id, send) {
    const stream = this._invalidatingStream(send);
    try {
      stream('start', {});
      const result = await this._installer.installRuntime(id, { runtimesRoot: this._svc.getRuntimesDir(), onEvent: stream });
      this._svc.invalidateRuntimesCache();
      return { result };
    } catch (err) {
      throw ImageRuntimeSetup._reportInstallFailure(stream, err);
    }
  }

  async uninstall(id) {
    const result = await this._installer.uninstallRuntime(id, { runtimesRoot: this._svc.getRuntimesDir() });
    this._svc.invalidateRuntimesCache();
    return result;
  }

  _invalidatingStream(send) {
    return (type, payload) => {
      if (type === 'finalize') this._svc.invalidateRuntimesCache();
      send(type, payload);
    };
  }

  async _findBinary(entry, dir) {
    const names = this._catalog.getBinaryNames(entry);
    const binaryPath = await BinaryLookup.findBinaryIn(dir, names);
    if (binaryPath) return binaryPath;
    const err = new Error(`No ${entry.name} executable (${names.join(', ')}) found in that folder.`);
    err.notFound = true;
    throw err;
  }

  static async _assertAccessible(binaryPath) {
    try {
      await fs.promises.access(binaryPath, fs.constants.F_OK);
    } catch (_) {
      throw new Error(`Path not accessible: ${binaryPath}`);
    }
  }

  static _reportInstallFailure(stream, err) {
    const fields = { code: err.code || null, detail: err.detail || null };
    stream('error', { message: err.message, ...fields });
    const failure = new Error(err.message);
    Object.assign(failure, fields);
    return failure;
  }
}

module.exports = ImageRuntimeSetup;
