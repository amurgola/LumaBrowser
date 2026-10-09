const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const HttpsFetcher = require('./HttpsFetcher');
const InstallRecord = require('../connect/InstallRecord');
const LumaHome = require('../connect/LumaHome');

class AppInstaller {
  static DEFAULT_MANIFEST_URL = 'https://lumabyte.com/install/manifest.json';
  static ISSUES_URL = 'https://github.com/amurgola/LumaBrowser/issues';
  static BAR_WIDTH = 20;

  constructor(out, { env = process.env, platform = process.platform, arch = process.arch } = {}) {
    this.out = out;
    this.manifestUrl = env.LUMABROWSER_MANIFEST_URL || AppInstaller.DEFAULT_MANIFEST_URL;
    this.platform = platform;
    this.arch = arch;
  }

  async install({ force = false } = {}) {
    this.out.info(`Checking ${this.manifestUrl.replace(/^https?:\/\//, '').split('/')[0]} for the latest LumaBrowser release…`);
    const manifest = await HttpsFetcher.request(this.manifestUrl, { json: true });
    const asset = this._assetFor(manifest);
    const current = InstallRecord.read();
    if (!force && AppInstaller._isCurrent(current, manifest)) return current;
    const record = await this._download(manifest, asset);
    InstallRecord.write(record);
    this.out.ok(`Installed LumaBrowser ${manifest.version}`);
    return record;
  }

  platformKey() {
    if (this.platform === 'win32') return 'win32-x64';
    if (this.platform === 'darwin') return this.arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64';
    if (this.platform === 'linux') return 'linux-x64';
    return `${this.platform}-${this.arch}`;
  }

  static renderBar(pct) {
    const filled = Math.floor((pct / 100) * AppInstaller.BAR_WIDTH);
    return `[${'#'.repeat(filled)}${'-'.repeat(AppInstaller.BAR_WIDTH - filled)}]`;
  }

  _assetFor(manifest) {
    const key = this.platformKey();
    const asset = manifest && manifest.assets && manifest.assets[key];
    if (asset && asset.url && asset.filename) return asset;
    const available = (manifest && manifest.assets) ? Object.keys(manifest.assets).join(', ') : '(none)';
    throw new Error(`No LumaBrowser build available for ${key}.\n`
      + `Available platforms in manifest: ${available}\n`
      + `If this is wrong, please open an issue at ${AppInstaller.ISSUES_URL}`);
  }

  static _isCurrent(current, manifest) {
    return !!(current && current.version === manifest.version && current.executable && fs.existsSync(current.executable));
  }

  async _download(manifest, asset) {
    fs.mkdirSync(LumaHome.dir(), { recursive: true });
    const downloadPath = path.join(LumaHome.dir(), asset.filename);
    this.out.ok(`Downloading LumaBrowser ${manifest.version}: ${asset.filename}`);
    await HttpsFetcher.download(asset.url, downloadPath, (p) => this._showProgress(p));
    this.out.progress(`\r${' '.repeat(80)}\r`);
    return {
      version: manifest.version,
      asset: asset.filename,
      executable: this._prepareExecutable(downloadPath),
      installedAt: new Date().toISOString(),
    };
  }

  _showProgress({ downloaded, total }) {
    const mb = (downloaded / 1024 / 1024).toFixed(1);
    const totalMb = (total / 1024 / 1024).toFixed(1);
    const pct = total ? Math.floor((downloaded / total) * 100) : 0;
    this.out.progress(`\r\x1b[36mDownloading\x1b[0m ${AppInstaller.renderBar(pct)} ${mb}/${totalMb} MB (${pct}%)   `);
  }

  _prepareExecutable(archivePath) {
    if (this.platform === 'win32') return archivePath;
    if (this.platform === 'linux') {
      try { fs.chmodSync(archivePath, 0o755); } catch (_) {}
      return archivePath;
    }
    if (this.platform === 'darwin') return AppInstaller._extractMacApp(archivePath);
    throw new Error(`Unsupported platform: ${this.platform}`);
  }

  static _extractMacApp(archivePath) {
    const extractDir = path.join(LumaHome.dir(), 'app');
    fs.rmSync(extractDir, { recursive: true, force: true });
    fs.mkdirSync(extractDir, { recursive: true });
    try {
      execSync(`ditto -x -k "${archivePath}" "${extractDir}"`, { stdio: 'inherit' });
    } catch (e) {
      throw new Error(`Failed to extract ${archivePath}: ${e.message}`);
    }
    const appBundle = fs.readdirSync(extractDir).find((n) => n.endsWith('.app'));
    if (!appBundle) throw new Error('No .app bundle found in downloaded archive.');
    const appPath = path.join(extractDir, appBundle);
    try { execSync(`xattr -dr com.apple.quarantine "${appPath}"`); } catch (_) {}
    return appPath;
  }
}

module.exports = AppInstaller;
