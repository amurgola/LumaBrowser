const fs = require('fs');
const BinaryLookup = require('../../shared/runtime/BinaryLookup');
const PathPicker = require('../../shared/ipc/PathPicker');
const RuntimeUpdateChecker = require('../../shared/runtime/RuntimeUpdateChecker');
const LlmRuntimeCatalog = require('../runtimes/LlmRuntimeCatalog');
const LlmRuntimeInstaller = require('../runtimes/LlmRuntimeInstaller');
const IpcFailure = require('./IpcFailure');

class LlmRuntimeSetup {
  static KIND = 'inference';
  static RUNTIME_ID_REQUIRED = 'runtimeId is required';

  constructor({ llmServerService, installer = LlmRuntimeInstaller.shared, catalog = LlmRuntimeCatalog.shared, pickPath = PathPicker.pick, platform = process.platform }) {
    this._svc = llmServerService;
    this._installer = installer;
    this._catalog = catalog;
    this._pickPath = pickPath;
    this._platform = platform;
    this._updateCache = new Map();
  }

  async view(opts) {
    return { view: await this._svc.ensureRuntimesView({ force: !!(opts && opts.force) }) };
  }

  async checkUpdates() {
    const view = await this._svc.ensureRuntimesView();
    const updates = await RuntimeUpdateChecker.check({
      view,
      kind: LlmRuntimeSetup.KIND,
      fetchLatestRelease: (repo) => this._installer.fetchLatestRelease(repo),
      fetchLatestPrerelease: (repo) => this._installer.fetchLatestPrerelease(repo),
      cache: this._updateCache,
    });
    return { updates };
  }

  async prerelease(id) {
    return { candidate: await this._installer.resolvePrerelease(id) };
  }

  async pickBinary(event, runtimeId) {
    const picked = await this._pickPath(event, {
      title: `Locate built binary for ${runtimeId}`,
      properties: ['openFile'],
      filters: this._binaryFilters(),
    });
    if (picked.canceled) return { canceled: true };
    return { canceled: false, binaryPath: picked.paths[0] };
  }

  async register(runtimeId, binaryPath) {
    if (!runtimeId) throw new Error(LlmRuntimeSetup.RUNTIME_ID_REQUIRED);
    if (!binaryPath) {
      this._setManualBinary(runtimeId, null);
      return { cleared: true };
    }
    await LlmRuntimeSetup._assertAccessible(binaryPath);
    this._setManualBinary(runtimeId, binaryPath);
    return {};
  }

  async locate(event, runtimeId) {
    if (!runtimeId) throw new Error(LlmRuntimeSetup.RUNTIME_ID_REQUIRED);
    const entry = this._catalog.getById(runtimeId);
    if (!entry) throw new Error(`Unknown runtime: ${runtimeId}`);
    const picked = await this._pickPath(event, { title: `Locate the folder containing ${entry.name}`, properties: ['openDirectory'] });
    if (picked.canceled) return { canceled: true };
    const dir = picked.paths[0];
    const binaryPath = await this._findBinary(entry, dir);
    this._setManualBinary(runtimeId, binaryPath);
    return { binaryPath, dir };
  }

  async install(id, opts, send) {
    const stream = this._invalidatingStream(send);
    try {
      stream('start', {});
      const result = await this._installer.installRuntime(id, {
        runtimesRoot: this._svc.getRuntimesDir(),
        onEvent: stream,
        channel: LlmRuntimeSetup.channelOf(opts),
      });
      this._svc.invalidateRuntimesCache();
      return { result };
    } catch (err) {
      throw LlmRuntimeSetup._reportInstallFailure(stream, err);
    }
  }

  async uninstall(id) {
    const result = await this._installer.uninstallRuntime(id, { runtimesRoot: this._svc.getRuntimesDir() });
    this._svc.invalidateRuntimesCache();
    return result;
  }

  static channelOf(opts) {
    return opts && opts.channel === 'prerelease' ? 'prerelease' : 'stable';
  }

  _binaryFilters() {
    const all = { name: 'All files', extensions: ['*'] };
    return this._platform === 'win32' ? [{ name: 'Executable', extensions: ['exe'] }, all] : [all];
  }

  _setManualBinary(runtimeId, binaryPath) {
    this._svc.setManualRuntimeBinary(runtimeId, binaryPath);
    this._svc.invalidateRuntimesCache();
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
    throw IpcFailure.of(`No ${entry.name} executable (${names.join(', ')}) found in that folder.`, { notFound: true });
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
    return IpcFailure.of(err.message, fields);
  }
}

module.exports = LlmRuntimeSetup;
