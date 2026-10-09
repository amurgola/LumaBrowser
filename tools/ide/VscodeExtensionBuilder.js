const fs = require('fs');
const path = require('path');
const IdeWebviewFiles = require('./IdeWebviewFiles');
const GeneratedFileWriter = require('./GeneratedFileWriter');
const RequireClosure = require('./RequireClosure');
const VsixArchiver = require('./VsixArchiver');
const FileTree = require('./FileTree');
const BuildSidecar = require('./BuildSidecar');

class VscodeExtensionBuilder {
  static BY = 'scripts/build-vscode-extension.js';
  static CLI_LIB_DIR = 'cli/lib';
  static CONNECT_ENTRIES = ['connect/AppDiscovery.js', 'connect/BridgeConnector.js'];
  static SHIP = ['package.json', 'extension.js', 'README.md', 'src', 'lib', 'media', 'resources'];
  static SKIP_MTIME = ['node_modules', '.vscode-test'];

  constructor(root, { log, error } = {}) {
    this._root = root;
    this._log = log || ((m) => process.stdout.write(`[vscode] ${m}\n`));
    this._error = error || ((m) => console.error(`[vscode] ${m}`));
    this._extDir = path.join(root, 'ide', 'vscode');
    this._distDir = path.join(root, 'ide', 'dist');
    this._outDir = path.join(this._distDir, 'luma-vscode');
    this._vsixPath = path.join(this._distDir, 'luma-vscode.vsix');
    this._sidecar = new BuildSidecar(path.join(this._distDir, 'vscode.json'));
  }

  async execute(args) {
    const flags = new Set(args);
    this._version = JSON.parse(fs.readFileSync(path.join(this._root, 'package.json'), 'utf8')).version;
    this.syncGenerated();
    if (flags.has('--skip')) return 0;
    if (!flags.has('--force') && this._isUpToDate()) { this._log(`up to date (v${this._version}); --force to rebuild`); return 0; }
    const manifest = this._stage();
    await VsixArchiver.zip(this._outDir, this._vsixPath, manifest);
    this._sidecar.write({ version: this._version, id: `${manifest.publisher}.${manifest.name}`, sourceMtime: this._sourceMtime() });
    this._log(`built ${path.relative(this._root, this._vsixPath)} (${manifest.publisher}.${manifest.name} v${this._version}, ${Math.round(fs.statSync(this._vsixPath).size / 1024)} KB)`);
    return 0;
  }

  syncGenerated() {
    const media = IdeWebviewFiles.syncPage(this._root, path.join(this._extDir, 'media'), VscodeExtensionBuilder.BY);
    this._syncIcon();
    const lib = this.connectPairs();
    GeneratedFileWriter.syncFiles(this._root, path.join(this._extDir, 'lib'), lib, VscodeExtensionBuilder.BY);
    this._log(`generated folders synced (media ${media} + icon, lib ${lib.length})`);
  }

  connectPairs() {
    const libDir = path.join(this._root, VscodeExtensionBuilder.CLI_LIB_DIR);
    const files = RequireClosure.collect(VscodeExtensionBuilder.CONNECT_ENTRIES.map((e) => path.join(libDir, e)));
    return files.map((f) => {
      const rel = path.relative(libDir, f);
      if (rel.startsWith('..')) throw new Error(`${VscodeExtensionBuilder.CLI_LIB_DIR} module requires ${f}, outside ${VscodeExtensionBuilder.CLI_LIB_DIR}`);
      return [path.relative(this._root, f).split(path.sep).join('/'), rel.split(path.sep).join('/')];
    });
  }

  _syncIcon() {
    const icon = path.join(this._root, 'icon', 'icon.png');
    const dst = path.join(this._extDir, 'media', 'icon.png');
    if (!fs.existsSync(icon)) return;
    if (!fs.existsSync(dst) || !fs.readFileSync(icon).equals(fs.readFileSync(dst))) fs.copyFileSync(icon, dst);
  }

  _isUpToDate() {
    return fs.existsSync(this._vsixPath) && this._sidecar.isUpToDate(this._version, this._sourceMtime());
  }

  _sourceMtime() {
    return FileTree.newestMtime(this._extDir, VscodeExtensionBuilder.SKIP_MTIME);
  }

  _stage() {
    fs.rmSync(this._outDir, { recursive: true, force: true });
    fs.mkdirSync(this._outDir, { recursive: true });
    this._copyShippedFiles();
    const license = this._copyLicense();
    const manifest = JSON.parse(fs.readFileSync(path.join(this._outDir, 'package.json'), 'utf8'));
    manifest.version = this._version;
    if (!license) delete manifest.license;
    fs.writeFileSync(path.join(this._outDir, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    return manifest;
  }

  _copyShippedFiles() {
    for (const name of VscodeExtensionBuilder.SHIP) {
      const src = path.join(this._extDir, name);
      if (!fs.existsSync(src)) {
        if (name === 'README.md') continue;
        throw new Error(`ide/vscode/${name} is missing`);
      }
      fs.cpSync(src, path.join(this._outDir, name), { recursive: true });
    }
  }

  _copyLicense() {
    const license = [path.join(this._root, 'LICENSE'), path.join(this._root, 'cli', 'LICENSE')].find((f) => fs.existsSync(f));
    if (license) fs.copyFileSync(license, path.join(this._outDir, 'LICENSE.txt'));
    return license || null;
  }
}

module.exports = VscodeExtensionBuilder;
