const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ModelCatalogRegistry = require('./ModelCatalogRegistry');
const ModelDownload = require('./ModelDownload');

class AddonModelSetup {
  static SIDECAR_SUFFIX = '.luma.json';
  static SIDECAR_SCHEMA = 'luma-addon-model';
  static HASH_CHUNK_BYTES = 8 * 1024 * 1024;
  static VERIFY_TICK_MS = 250;

  constructor({ registry = ModelCatalogRegistry.shared, download = ModelDownload } = {}) {
    this._registry = registry;
    this._download = download;
  }

  async execute(id, { modelsDir, runtimesRoot, detectRuntime, installRuntime, onEvent, isCanceled, handle } = {}) {
    this._setupSharedVariablesFromParameters(id, { modelsDir, runtimesRoot, detectRuntime, installRuntime, onEvent, isCanceled, handle });
    this._emit('start', { id });
    await this._ensureRuntime();
    await this._downloadWeights();
    await this._verifyChecksum();
    return this._writeSidecarAndFinish();
  }

  static sidecarPathFor(weightsPath) {
    return `${weightsPath}${AddonModelSetup.SIDECAR_SUFFIX}`;
  }

  static destPathFor(entry, modelsDir) {
    const folder = String(entry.dir || entry.id).replace(/[\\/]+/g, '_');
    return path.join(modelsDir, folder, entry.file.filename);
  }

  static isInstalled(entry, modelsDir) {
    const dest = AddonModelSetup.destPathFor(entry, modelsDir);
    try {
      return fs.statSync(dest).isFile() && !!AddonModelSetup.readSidecar(dest);
    } catch (_) {
      return false;
    }
  }

  static readSidecar(weightsPath) {
    try {
      const sidecar = JSON.parse(fs.readFileSync(AddonModelSetup.sidecarPathFor(weightsPath), 'utf8'));
      return sidecar && sidecar.schema === AddonModelSetup.SIDECAR_SCHEMA ? sidecar : null;
    } catch (_) {
      return null;
    }
  }

  static sha256File(filePath, { onTick, isCanceled } = {}) {
    return new Promise((resolve, reject) => {
      const total = AddonModelSetup._sizeOrNull(filePath) || 0;
      const hash = crypto.createHash('sha256');
      const tick = AddonModelSetup._throttled(onTick);
      let read = 0;
      const stream = fs.createReadStream(filePath, { highWaterMark: AddonModelSetup.HASH_CHUNK_BYTES });
      stream.on('data', (chunk) => {
        if (typeof isCanceled === 'function' && isCanceled()) return stream.destroy(new Error('canceled'));
        hash.update(chunk);
        read += chunk.length;
        tick(read, total, false);
      });
      stream.on('error', reject);
      stream.on('end', () => {
        tick(read, total, true);
        resolve(hash.digest('hex'));
      });
    });
  }

  _setupSharedVariablesFromParameters(id, options) {
    this._entry = this._registry.getById(id);
    if (!this._entry) throw AddonModelSetup._typedError(`Unknown add-on model: ${id}`, 'ADDON_MODEL_UNKNOWN');
    if (!options.modelsDir) throw new Error('setupAddonModel: modelsDir is required');
    this._options = options;
    this._runtimeId = this._entry.requiresRuntime || null;
    this._destPath = AddonModelSetup.destPathFor(this._entry, options.modelsDir);
    this._sha256 = null;
  }

  async _ensureRuntime() {
    if (!this._runtimeId) return;
    const detail = await this._detectRuntime();
    if (!detail) throw AddonModelSetup._typedError(`Runtime ${this._runtimeId} is not available on this host.`, 'RUNTIME_UNAVAILABLE');
    if (!detail.installed) await this._installRuntime();
    this._throwIfCanceled();
  }

  async _detectRuntime() {
    const { detectRuntime } = this._options;
    return typeof detectRuntime === 'function' ? detectRuntime(this._runtimeId) : null;
  }

  async _installRuntime() {
    const { installRuntime, runtimesRoot } = this._options;
    if (typeof installRuntime !== 'function') {
      throw AddonModelSetup._typedError(`Runtime ${this._runtimeId} is not installed and cannot be installed automatically.`, 'RUNTIME_NOT_INSTALLED');
    }
    const runtimeId = this._runtimeId;
    this._emit('runtime', { runtimeId, type: 'start', payload: {} });
    await installRuntime(runtimeId, {
      runtimesRoot,
      isCanceled: () => this._canceled(),
      onEvent: (type, payload) => this._emit('runtime', { runtimeId, type, payload }),
    });
    this._emit('runtime', { runtimeId, type: 'finalize', payload: {} });
  }

  async _downloadWeights() {
    fs.mkdirSync(path.dirname(this._destPath), { recursive: true });
    const transfer = this._download.start({
      url: this._entry.file.url,
      destPath: this._destPath,
      onEvent: (type, payload) => this._emit('model', { type, payload }),
    });
    this._setCancel(() => transfer.cancel());
    const result = await transfer.promise;
    this._setCancel(() => {});
    if (this._canceled() || (result && (result.canceled || result.paused))) throw AddonModelSetup._canceledError();
  }

  async _verifyChecksum() {
    const expected = this._entry.file.sha256;
    if (!expected) return;
    this._sha256 = await AddonModelSetup.sha256File(this._destPath, {
      isCanceled: () => this._canceled(),
      onTick: (read, total) => this._emit('verify', { read, total }),
    });
    if (this._sha256.toLowerCase() === String(expected).toLowerCase()) return;
    AddonModelSetup._removeQuietly(this._destPath);
    throw AddonModelSetup._typedError(
      `Checksum mismatch for ${this._entry.file.filename}: expected ${expected}, got ${this._sha256}`, 'CHECKSUM_MISMATCH');
  }

  _writeSidecarAndFinish() {
    const sidecarPath = AddonModelSetup.sidecarPathFor(this._destPath);
    fs.writeFileSync(sidecarPath, JSON.stringify(this._sidecar(), null, 2));
    this._emit('sidecar', { path: sidecarPath });
    const result = { destPath: this._destPath, runtimeId: this._runtimeId, sidecar: sidecarPath };
    this._emit('done', result);
    return result;
  }

  _sidecar() {
    const entry = this._entry;
    return {
      schema: AddonModelSetup.SIDECAR_SCHEMA,
      id: entry.id,
      kind: entry.kind,
      label: entry.label || entry.id,
      requiresRuntime: this._runtimeId,
      contextLength: Number(entry.contextLength) || null,
      defaultContextSize: Number(entry.defaultContextSize) || null,
      bytes: AddonModelSetup._sizeOrNull(this._destPath),
      sha256: this._sha256,
      installedAt: new Date().toISOString(),
      ...(entry.sidecar && typeof entry.sidecar === 'object' ? entry.sidecar : {}),
    };
  }

  _setCancel(cancel) {
    const { handle } = this._options;
    if (handle) handle.cancel = () => { try { cancel(); } catch (_) {} };
  }

  _canceled() {
    const { isCanceled } = this._options;
    return typeof isCanceled === 'function' ? !!isCanceled() : false;
  }

  _throwIfCanceled() {
    if (this._canceled()) throw AddonModelSetup._canceledError();
  }

  _emit(type, payload) {
    try {
      if (this._options.onEvent) this._options.onEvent(type, payload);
    } catch (_) {}
  }

  static _throttled(onTick) {
    let lastTick = 0;
    return (read, total, final) => {
      if (typeof onTick !== 'function') return;
      const now = Date.now();
      if (!final && now - lastTick <= AddonModelSetup.VERIFY_TICK_MS) return;
      lastTick = now;
      onTick(read, total);
    };
  }

  static _sizeOrNull(filePath) {
    try {
      return fs.statSync(filePath).size;
    } catch (_) {
      return null;
    }
  }

  static _removeQuietly(filePath) {
    try {
      fs.unlinkSync(filePath);
    } catch (_) {}
  }

  static _canceledError() {
    return AddonModelSetup._typedError('Setup canceled.', 'CANCELED');
  }

  static _typedError(message, code) {
    const err = new Error(message);
    err.code = code;
    return err;
  }
}

module.exports = AddonModelSetup;
