const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { session } = require('electron');
const Slug = require('../shared/text/Slug');
const ChromeExtensionSchema = require('./ChromeExtensionSchema');
const ChromeExtensionRepository = require('./ChromeExtensionRepository');
const ChromeExtensionManifest = require('./ChromeExtensionManifest');
const ExtensionSessionLoader = require('./ExtensionSessionLoader');

class ChromeExtensionService {
  static STORE_DIR_NAME = 'chrome-extensions';
  static FOLDER_SUFFIX_LENGTH = 8;
  static SLUG_OPTIONS = { fallback: 'ext', maxLength: 32 };
  static DEFAULT_MANIFEST_VERSION = 2;
  static SOURCE_UNPACKED = 'unpacked';

  constructor(settingsDb, dataDir) {
    this._settingsDb = settingsDb;
    this._storeDir = path.join(dataDir, ChromeExtensionService.STORE_DIR_NAME);
    this._repository = new ChromeExtensionRepository(settingsDb.db);
    this._loader = new ExtensionSessionLoader();
    this.ready = false;
  }

  async init() {
    ChromeExtensionSchema.ensure(this._settingsDb.db);
    fs.mkdirSync(this._storeDir, { recursive: true });
  }

  list() {
    return this._repository.list().map(ChromeExtensionService._toDto);
  }

  get(id) {
    const row = this._repository.get(id);
    return row ? ChromeExtensionService._toDto(row) : null;
  }

  async installFromDirectory(srcPath) {
    const manifest = ChromeExtensionManifest.read(srcPath);
    const destPath = this._copyIntoStore(srcPath, manifest);
    const loaded = await this._loader.loadIntoDefault(destPath);
    this._repository.upsert(ChromeExtensionService._newRow(manifest, loaded, destPath));
    await this._loader.loadEverywhere(destPath, loaded.id, { except: session.defaultSession });
    return this.get(loaded.id);
  }

  async remove(id) {
    const ext = this.get(id);
    if (!ext) return false;
    this._loader.unloadEverywhere(id);
    ChromeExtensionService._deleteFolder(ext.path);
    this._repository.remove(id);
    return true;
  }

  async setEnabled(id, enabled) {
    const ext = this.get(id);
    if (!ext) return false;
    this._repository.setEnabled(id, enabled);
    if (enabled) await this._loader.loadEverywhere(ext.path, id);
    else this._loader.unloadEverywhere(id);
    return true;
  }

  async loadAllEnabled(sess) {
    if (!sess) return 0;
    this._loader.track(sess);
    let newlyLoaded = 0;
    for (const row of this._repository.listEnabled()) {
      if (await this._loader.loadInto(sess, row.path, row.id)) newlyLoaded++;
    }
    return newlyLoaded;
  }

  async ensureLoadedForWebContents(wc) {
    if (!wc || wc.isDestroyed()) return;
    const newlyLoaded = await this.loadAllEnabled(wc.session);
    if (newlyLoaded > 0) {
      try { wc.reload(); } catch (_) {}
    }
  }

  _copyIntoStore(srcPath, manifest) {
    const destPath = path.join(this._storeDir, ChromeExtensionService.folderNameFor(manifest.name));
    fs.cpSync(srcPath, destPath, { recursive: true });
    return destPath;
  }

  static folderNameFor(name) {
    const suffix = crypto.randomUUID().slice(0, ChromeExtensionService.FOLDER_SUFFIX_LENGTH);
    return `${Slug.from(name, ChromeExtensionService.SLUG_OPTIONS)}-${suffix}`;
  }

  static _newRow(manifest, loaded, destPath) {
    return {
      id: loaded.id,
      name: manifest.name || loaded.name || 'Unknown',
      version: manifest.version || loaded.version || '',
      path: destPath,
      manifest_version: manifest.manifest_version || ChromeExtensionService.DEFAULT_MANIFEST_VERSION,
      enabled: 1,
      installed_at: Date.now(),
      source: ChromeExtensionService.SOURCE_UNPACKED,
    };
  }

  static _toDto(row) {
    return {
      id: row.id,
      name: row.name,
      version: row.version,
      path: row.path,
      manifestVersion: row.manifest_version,
      enabled: !!row.enabled,
      installedAt: row.installed_at,
      source: row.source,
    };
  }

  static _deleteFolder(folderPath) {
    try {
      fs.rmSync(folderPath, { recursive: true, force: true });
    } catch (err) {
      console.warn('[chrome-ext] failed to delete', folderPath, err.message);
    }
  }
}

module.exports = ChromeExtensionService;
