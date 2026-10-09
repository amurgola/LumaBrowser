const fs = require('fs');
const os = require('os');
const path = require('path');
const IdeInstaller = require('./ide-installers/IdeInstaller');
const EditorCliRunner = require('./ide-installers/EditorCliRunner');
const VersionCompare = require('./ide-installers/VersionCompare');
const VscodeEditorLocator = require('./ide-installers/VscodeEditorLocator');

class VscodeExtensionInstaller extends IdeInstaller {
  static EXTENSION_ID = 'lumabyte.luma-vscode';
  static VSIX_NAME = 'luma-vscode.vsix';
  static SIDECAR_FILE = 'vscode.json';
  static EDITORS = VscodeEditorLocator.EDITORS;

  constructor({ vsixPath, version, platform, homeDir, env, fsOps, run } = {}) {
    super();
    if (!vsixPath) throw new Error('VscodeExtensionInstaller requires vsixPath');
    this.vsixPath = vsixPath;
    this.version = version || null;
    this.platform = platform || process.platform;
    this.homeDir = homeDir || os.homedir();
    this.env = env || process.env;
    this.fs = fsOps || fs;
    this.run = run || ((cli, args) => EditorCliRunner.run(cli, args, { platform: this.platform }));
    this._locator = new VscodeEditorLocator({ platform: this.platform, homeDir: this.homeDir, env: this.env, fsOps: this.fs });
  }

  available() {
    try { return this.fs.statSync(this.vsixPath).isFile(); } catch (_) { return false; }
  }

  sourceVersion() {
    try {
      const json = JSON.parse(this.fs.readFileSync(path.join(path.dirname(this.vsixPath), VscodeExtensionInstaller.SIDECAR_FILE), 'utf8'));
      if (json && json.version) return String(json.version);
    } catch (_) {}
    return this.version;
  }

  detectIdes() {
    const source = this.sourceVersion();
    return VscodeExtensionInstaller.EDITORS
      .map((editor) => ({ editor, cliPath: this._locator.findCli(editor) }))
      .filter(({ cliPath }) => cliPath)
      .map(({ editor, cliPath }) => this._editorRow(editor, cliPath, source));
  }

  _statusDetails() {
    return { vsixPath: this.vsixPath, extensionId: VscodeExtensionInstaller.EXTENSION_ID };
  }

  _notBundledMessage() {
    return 'The VS Code extension is not bundled in this build.';
  }

  async _installInto(ide) {
    const result = await this.run(ide.cliPath, ['--install-extension', this.vsixPath, '--force']);
    if (result.code !== 0) throw new Error(VscodeExtensionInstaller._failure(ide, result));
  }

  async _removeFrom(ide) {
    const result = await this.run(ide.cliPath, ['--uninstall-extension', VscodeExtensionInstaller.EXTENSION_ID]);
    if (result.code === 0 || /not installed/i.test(result.output || '')) return;
    throw new Error(VscodeExtensionInstaller._failure(ide, result));
  }

  _staleIdes() {
    const source = this.sourceVersion();
    if (!source) return [];
    return this.detectIdes().filter((ide) => ide.installed && VersionCompare.compare(source, ide.installedVersion) > 0);
  }

  _editorRow(editor, cliPath, source) {
    const installedVersion = this._locator.installedVersion(editor, VscodeExtensionInstaller.EXTENSION_ID);
    return {
      id: editor.id,
      product: editor.id,
      label: editor.label,
      cliPath,
      extensionsDir: this._locator.extensionsDir(editor),
      installed: !!installedVersion,
      installedVersion,
      current: !!installedVersion && !!source && installedVersion === source,
      latest: true,
    };
  }

  static _failure(ide, result) {
    return EditorCliRunner.lastMeaningfulLine(result.output) || `the ${ide.label} CLI exited with ${result.code}`;
  }
}

module.exports = VscodeExtensionInstaller;
