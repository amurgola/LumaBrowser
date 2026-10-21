const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { session } = require('electron');
const Slug = require('../shared/text/Slug');
const ChromeExtensionSchema = require('./ChromeExtensionSchema');
const ChromeExtensionRepository = require('./ChromeExtensionRepository');
const ChromeExtensionManifest = require('./ChromeExtensionManifest');
const ExtensionSessionLoader = require('./ExtensionSessionLoader');
const FirstNavigationGuard = require('./FirstNavigationGuard');
const ChromeApiShim = require('./shim/ChromeApiShim');

class ChromeExtensionService {
  static STORE_DIR_NAME = 'chrome-extensions';
  static FOLDER_SUFFIX_LENGTH = 8;
  static SLUG_OPTIONS = { fallback: 'ext', maxLength: 32 };
  static DEFAULT_MANIFEST_VERSION = 2;
  static SOURCE_UNPACKED = 'unpacked';
  static SOURCE_WEBSTORE = 'webstore';
  static ICON_TYPES = { '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

  constructor(settingsDb, dataDir, { bridge = null } = {}) {
    this._settingsDb = settingsDb;
    this._storeDir = path.join(dataDir, ChromeExtensionService.STORE_DIR_NAME);
    this._repository = new ChromeExtensionRepository(settingsDb.db);
    this.bridge = bridge;
    this._loader = new ExtensionSessionLoader({ onTrack: (sess) => { if (this.bridge) this.bridge.attach(sess); } });
    this.ready = false;
  }

  async init() {
    ChromeExtensionSchema.ensure(this._settingsDb.db);
    fs.mkdirSync(this._storeDir, { recursive: true });
    for (const row of this._repository.list()) ChromeExtensionService._refreshShim(row.path);
  }

  static _refreshShim(extPath) {
    try {
      if (fs.existsSync(extPath)) ChromeApiShim.apply(extPath);
    } catch (err) {
      console.warn('[chrome-ext] could not refresh the chrome.* shim in', extPath, err.message);
    }
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
    await this._saveAndSpread(manifest, loaded, destPath, ChromeExtensionService.SOURCE_UNPACKED);
    return this.get(loaded.id);
  }

  async installFromStorePackage(srcPath, storeId) {
    const manifest = ChromeExtensionManifest.read(srcPath);
    const destPath = this._copyIntoStore(srcPath, manifest);
    const previous = this.get(storeId);
    if (previous) this._loader.unloadEverywhere(storeId);
    let loaded;
    try {
      loaded = await this._loader.loadIntoDefault(destPath);
      if (loaded.id !== storeId) throw new Error(`Electron loaded the package as ${loaded.id}, expected ${storeId}`);
    } catch (err) {
      if (loaded) this._loader.unloadEverywhere(loaded.id);
      ChromeExtensionService._deleteFolder(destPath);
      if (previous && previous.enabled) await this._loader.loadEverywhere(previous.path, storeId);
      throw err;
    }
    if (previous && previous.path !== destPath) ChromeExtensionService._deleteFolder(previous.path);
    await this._saveAndSpread(manifest, loaded, destPath, ChromeExtensionService.SOURCE_WEBSTORE);
    return this.get(storeId);
  }

  async remove(id) {
    const ext = this.get(id);
    if (!ext) return false;
    this._loader.unloadEverywhere(id);
    ChromeExtensionService._deleteFolder(ext.path);
    this._repository.remove(id);
    if (this.bridge) this.bridge.forgetExtension(id);
    return true;
  }

  async setEnabled(id, enabled) {
    const ext = this.get(id);
    if (!ext) return false;
    this._repository.setEnabled(id, enabled);
    if (enabled) await this._loader.loadEverywhere(ext.path, id);
    else {
      this._loader.unloadEverywhere(id);
      if (this.bridge) this.bridge.forgetExtension(id);
    }
    return true;
  }

  async loadAllEnabled(sess) {
    if (!sess) return 0;
    this._loader.track(sess);
    const loads = this._repository.listEnabled().map((row) => this._loader.loadInto(sess, row.path, row.id));
    return (await Promise.all(loads)).filter(Boolean).length;
  }

  loadsInFlight(sess) {
    return sess && this._loader.isLoading(sess) ? this._loader.settled(sess) : null;
  }

  async ensureLoadedForWebContents(wc) {
    if (!wc || wc.isDestroyed()) return;
    const guard = new FirstNavigationGuard(wc);
    const newlyLoaded = await this.loadAllEnabled(wc.session);
    await this._loader.settled(wc.session);
    if (!guard.done) {
      await guard.restartIfStalled();
      return;
    }
    guard.dispose();
    if (newlyLoaded > 0 && !wc.isDestroyed()) {
      try { wc.reload(); } catch (_) {}
    }
  }

  _saveAndSpread(manifest, loaded, destPath, source) {
    this._repository.upsert(ChromeExtensionService._newRow(manifest, loaded, destPath, source));
    return this._loader.loadEverywhere(destPath, loaded.id, { except: session.defaultSession });
  }

  _copyIntoStore(srcPath, manifest) {
    const name = ChromeExtensionManifest.localized(manifest, srcPath, 'name');
    const destPath = path.join(this._storeDir, ChromeExtensionService.folderNameFor(name));
    fs.cpSync(srcPath, destPath, { recursive: true });
    try {
      ChromeApiShim.apply(destPath);
    } catch (err) {
      console.warn('[chrome-ext] could not add the chrome.* shim to', destPath, err.message);
    }
    return destPath;
  }

  static folderNameFor(name) {
    const suffix = crypto.randomUUID().slice(0, ChromeExtensionService.FOLDER_SUFFIX_LENGTH);
    return `${Slug.from(name, ChromeExtensionService.SLUG_OPTIONS)}-${suffix}`;
  }

  static _newRow(manifest, loaded, destPath, source) {
    return {
      id: loaded.id,
      name: ChromeExtensionManifest.localized(manifest, destPath, 'name') || loaded.name || 'Unknown',
      version: manifest.version || loaded.version || '',
      path: destPath,
      manifest_version: manifest.manifest_version || ChromeExtensionService.DEFAULT_MANIFEST_VERSION,
      enabled: 1,
      installed_at: Date.now(),
      source,
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
      pages: ChromeExtensionService._pagesOf(row.path),
      icon: ChromeExtensionService._iconOf(row.path),
      description: ChromeExtensionService._descriptionOf(row.path),
    };
  }

  static _descriptionOf(extPath) {
    try {
      return ChromeExtensionManifest.localized(ChromeExtensionManifest.read(extPath), extPath, 'description') || '';
    } catch (_) {
      return '';
    }
  }

  static _iconOf(extPath) {
    try {
      const relative = ChromeExtensionManifest.iconOf(ChromeExtensionManifest.read(extPath));
      if (!relative) return null;
      const file = path.resolve(extPath, relative);
      const mime = ChromeExtensionService.ICON_TYPES[path.extname(file).toLowerCase()];
      if (!mime || !file.startsWith(path.resolve(extPath) + path.sep)) return null;
      return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
    } catch (_) {
      return null;
    }
  }

  static _pagesOf(extPath) {
    try {
      return ChromeExtensionManifest.pagesOf(ChromeExtensionManifest.read(extPath));
    } catch (_) {
      return { popup: null, options: null };
    }
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
