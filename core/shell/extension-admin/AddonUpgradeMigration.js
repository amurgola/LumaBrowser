const AddonCatalog = require('./AddonCatalog');
const ExtensionZipInstaller = require('./ExtensionZipInstaller');
const UnbundledAddons = require('./UnbundledAddons');
const AddonClient = require('../AddonClient');
const SetupCompletion = require('../settings/SetupCompletion');

class AddonUpgradeMigration {
  static LAST_RUN_KEY = 'core.lastRunVersion';
  static UNRECORDED_VERSION = '2.2.7';

  constructor({ settings, catalog, currentVersion, log = console }) {
    this._settings = settings;
    this._catalog = catalog;
    this._currentVersion = currentVersion;
    this._log = log;
  }

  static forApp({ settings, extensionManager, identity, rootDir, currentVersion, log = console }) {
    const catalog = new AddonCatalog({
      client: new AddonClient({ identity }),
      installer: new ExtensionZipInstaller({ extensionManager, rootDir, log }),
      extensionManager,
    });
    return new AddonUpgradeMigration({ settings, catalog, currentVersion, log });
  }

  async run() {
    const previousVersion = this._previousVersion();
    const missing = this._missingAddons(previousVersion);
    const { installed, failed } = await this._installAll(missing);
    if (failed.length === 0) this._recordCurrentVersion();
    this._report(previousVersion, installed, failed);
    return { previousVersion, installed, failed };
  }

  _previousVersion() {
    const recorded = this._settings.get(AddonUpgradeMigration.LAST_RUN_KEY, null);
    if (recorded) return String(recorded);
    const setUp = this._settings.get(SetupCompletion.KEY, null);
    return setUp ? AddonUpgradeMigration.UNRECORDED_VERSION : null;
  }

  _missingAddons(previousVersion) {
    if (!previousVersion) return [];
    return UnbundledAddons.between(previousVersion, this._currentVersion)
      .filter((id) => !this._catalog.isInstalled(id));
  }

  async _installAll(ids) {
    const installed = [];
    const failed = [];
    for (const id of ids) {
      const error = await this._installOne(id);
      if (error) failed.push({ id, error });
      else installed.push(id);
    }
    return { installed, failed };
  }

  async _installOne(id) {
    try {
      const result = await this._catalog.downloadAndInstall(id);
      return result && result.success ? null : ((result && result.error) || 'install failed');
    } catch (err) {
      return (err && err.message) || 'install failed';
    }
  }

  _recordCurrentVersion() {
    this._settings.set(AddonUpgradeMigration.LAST_RUN_KEY, this._currentVersion);
  }

  _report(previousVersion, installed, failed) {
    if (installed.length) {
      this._log.log(`[addon-upgrade] ${previousVersion} -> ${this._currentVersion}: installed ${installed.join(', ')}`);
    }
    for (const { id, error } of failed) {
      this._log.error(`[addon-upgrade] could not install ${id} (${error}); trying again next launch`);
    }
  }
}

module.exports = AddonUpgradeMigration;
