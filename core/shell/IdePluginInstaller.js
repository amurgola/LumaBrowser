const fs = require('fs');
const os = require('os');
const path = require('path');
const IdeInstaller = require('./ide-installers/IdeInstaller');
const JetBrainsIdeDir = require('./ide-installers/JetBrainsIdeDir');

class IdePluginInstaller extends IdeInstaller {
  static PLUGIN_DIR_NAME = 'luma-jetbrains';
  static MARKER_FILE = 'luma-plugin.json';
  static SIDECAR_FILE = 'jetbrains.json';
  static INSTALL_FAILED = 'copy failed';

  constructor({ sourceDir, version, platform, homeDir, appData, fsOps } = {}) {
    super();
    if (!sourceDir) throw new Error('IdePluginInstaller requires sourceDir');
    this.sourceDir = sourceDir;
    this.version = version || null;
    this.platform = platform || process.platform;
    this.homeDir = homeDir || os.homedir();
    this.appData = appData || process.env.APPDATA || path.join(this.homeDir, 'AppData', 'Roaming');
    this.fs = fsOps || fs;
  }

  available() {
    return this._isDirectory(path.join(this.sourceDir, 'lib'));
  }

  sourceVersion() {
    const candidates = [
      path.join(this.sourceDir, IdePluginInstaller.MARKER_FILE),
      path.join(path.dirname(this.sourceDir), IdePluginInstaller.SIDECAR_FILE),
    ];
    for (const file of candidates) {
      const json = this._readJson(file);
      if (json && json.version) return String(json.version);
    }
    return this.version;
  }

  roots() {
    return JetBrainsIdeDir.vendorRoots(this.platform, this.homeDir, this.appData);
  }

  detectIdes() {
    const source = this.sourceVersion();
    const ides = this.roots().flatMap((root) => this._idesUnder(root, source));
    ides.sort(JetBrainsIdeDir.compare);
    IdePluginInstaller._flagNewestPerProduct(ides);
    return ides;
  }

  _statusDetails() {
    return { sourceDir: this.sourceDir, pluginDirName: IdePluginInstaller.PLUGIN_DIR_NAME };
  }

  _notBundledMessage() {
    return 'The JetBrains plugin is not bundled in this build.';
  }

  _installInto(ide) {
    this.fs.rmSync(ide.pluginDir, { recursive: true, force: true });
    this.fs.mkdirSync(ide.pluginDir, { recursive: true });
    this.fs.cpSync(this.sourceDir, ide.pluginDir, { recursive: true });
    this.fs.writeFileSync(path.join(ide.pluginDir, IdePluginInstaller.MARKER_FILE), JSON.stringify(this._marker(), null, 2));
  }

  _removeFrom(ide) {
    this.fs.rmSync(ide.pluginDir, { recursive: true, force: true });
  }

  _staleIdes() {
    return this.detectIdes().filter((ide) => ide.installed && !ide.current);
  }

  _idesUnder(root, source) {
    return this._listDir(root.configRoot)
      .map((name) => ({ name, parsed: JetBrainsIdeDir.parse(name) }))
      .filter(({ name, parsed }) => parsed && this._isDirectory(path.join(root.configRoot, name)))
      .map(({ name, parsed }) => this._ideRow(root, name, parsed, source));
  }

  _ideRow(root, name, parsed, source) {
    const pluginsDir = JetBrainsIdeDir.pluginsDir(root, name);
    const pluginDir = path.join(pluginsDir, IdePluginInstaller.PLUGIN_DIR_NAME);
    const marker = this._readJson(path.join(pluginDir, IdePluginInstaller.MARKER_FILE));
    const installed = !!marker || this._isDirectory(path.join(pluginDir, 'lib'));
    const installedVersion = marker ? marker.version || null : null;
    return {
      id: name,
      product: parsed.product,
      version: parsed.version,
      label: parsed.label,
      configDir: path.join(root.configRoot, name),
      pluginsDir,
      pluginDir,
      installed,
      installedVersion,
      current: installed && !!source && installedVersion === source,
    };
  }

  static _flagNewestPerProduct(sortedIdes) {
    const seen = new Set();
    for (const ide of sortedIdes) {
      ide.latest = !seen.has(ide.product);
      seen.add(ide.product);
    }
  }

  _marker() {
    return { version: this.sourceVersion(), appVersion: this.version, installedAt: new Date().toISOString() };
  }

  _listDir(dir) {
    try { return this.fs.readdirSync(dir); } catch (_) { return []; }
  }

  _isDirectory(target) {
    try { return this.fs.statSync(target).isDirectory(); } catch (_) { return false; }
  }

  _readJson(file) {
    try { return JSON.parse(this.fs.readFileSync(file, 'utf8')); } catch (_) { return null; }
  }
}

module.exports = IdePluginInstaller;
