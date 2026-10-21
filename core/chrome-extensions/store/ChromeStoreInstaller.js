const fs = require('fs');
const os = require('os');
const path = require('path');
const CrxArchive = require('./CrxArchive');
const ChromeWebStoreClient = require('./ChromeWebStoreClient');
const ChromeExtensionManifest = require('../ChromeExtensionManifest');

class ChromeStoreInstaller {
  static STORE_ONLY_ENTRIES = ['_metadata'];
  static TEMP_PREFIX = 'luma-crx-';

  constructor({ service, client = new ChromeWebStoreClient(), extractZip = null, tmpDir = os.tmpdir() }) {
    this._service = service;
    this._client = client;
    this._extractZip = extractZip || require('extract-zip');
    this._tmpDir = tmpDir;
  }

  async install(input) {
    const id = ChromeWebStoreClient.resolveId(input);
    if (!id) throw new Error('Enter a Chrome Web Store link or a 32-letter extension id');
    const crx = CrxArchive.parse(await this._client.downloadCrx(id));
    if (crx.id !== id) throw new Error(`Downloaded package is extension ${crx.id}, not ${id}`);
    const workDir = fs.mkdtempSync(path.join(this._tmpDir, ChromeStoreInstaller.TEMP_PREFIX));
    try {
      const unpacked = await this._unpack(crx.zip, workDir);
      ChromeStoreInstaller.prepareFolder(unpacked, crx.publicKey);
      return await this._service.installFromStorePackage(unpacked, id);
    } finally {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  }

  async checkForUpdate(id) {
    const ext = this._service.get(id);
    if (!ext) throw new Error(`Extension ${id} is not installed`);
    const latestVersion = await this._client.latestVersion(id);
    return {
      id,
      installedVersion: ext.version,
      latestVersion,
      updateAvailable: !!latestVersion && ChromeStoreInstaller.compareVersions(latestVersion, ext.version) > 0,
    };
  }

  static prepareFolder(dir, publicKey) {
    for (const entry of ChromeStoreInstaller.STORE_ONLY_ENTRIES) {
      fs.rmSync(path.join(dir, entry), { recursive: true, force: true });
    }
    const manifest = ChromeExtensionManifest.read(dir);
    manifest.key = Buffer.from(publicKey).toString('base64');
    fs.writeFileSync(path.join(dir, ChromeExtensionManifest.FILE_NAME), JSON.stringify(manifest, null, 2));
  }

  static compareVersions(a, b) {
    const pa = String(a || '').split('.').map((n) => parseInt(n, 10) || 0);
    const pb = String(b || '').split('.').map((n) => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const diff = (pa[i] || 0) - (pb[i] || 0);
      if (diff !== 0) return Math.sign(diff);
    }
    return 0;
  }

  async _unpack(zip, workDir) {
    const zipPath = path.join(workDir, 'package.zip');
    const unpacked = path.join(workDir, 'unpacked');
    fs.writeFileSync(zipPath, zip);
    fs.mkdirSync(unpacked);
    await this._extractZip(zipPath, { dir: unpacked });
    return unpacked;
  }
}

module.exports = ChromeStoreInstaller;
