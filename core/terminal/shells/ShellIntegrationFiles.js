const fs = require('fs');
const path = require('path');

class ShellIntegrationFiles {
  static SOURCE_DIR = path.join(__dirname, 'integration');
  static POWERSHELL = 'luma-integration.ps1';
  static BASH = 'luma-integration.bash';
  static ZSH = 'luma-integration.zsh';
  static ZSH_DIR = 'zsh';
  static ZSH_STAGES = ['zshenv', 'zprofile', 'zshrc', 'zlogin'];

  constructor(dir, fsOps = fs) {
    this._dir = dir;
    this._fs = fsOps;
    this._written = false;
  }

  powershellScript() {
    return this._fs.readFileSync(path.join(ShellIntegrationFiles.SOURCE_DIR, ShellIntegrationFiles.POWERSHELL), 'utf8');
  }

  bashInitFile() {
    this._ensureWritten();
    return ShellIntegrationFiles._posix(path.join(this._dir, ShellIntegrationFiles.BASH));
  }

  zshDotDir() {
    this._ensureWritten();
    return path.join(this._dir, ShellIntegrationFiles.ZSH_DIR);
  }

  _ensureWritten() {
    if (this._written) return;
    this._copy(ShellIntegrationFiles.BASH, path.join(this._dir, ShellIntegrationFiles.BASH));
    this._writeZshFolder();
    this._written = true;
  }

  _writeZshFolder() {
    const zshDir = path.join(this._dir, ShellIntegrationFiles.ZSH_DIR);
    const script = path.join(zshDir, ShellIntegrationFiles.ZSH);
    this._copy(ShellIntegrationFiles.ZSH, script);
    for (const stage of ShellIntegrationFiles.ZSH_STAGES) {
      this._fs.writeFileSync(path.join(zshDir, `.${stage}`), `. ${ShellIntegrationFiles.shellQuote(script)} ${stage}\n`);
    }
  }

  _copy(name, target) {
    const source = this._fs.readFileSync(path.join(ShellIntegrationFiles.SOURCE_DIR, name), 'utf8');
    this._fs.mkdirSync(path.dirname(target), { recursive: true });
    this._fs.writeFileSync(target, source.replace(/\r\n/g, '\n'));
  }

  static shellQuote(text) {
    return `'${String(text).replace(/'/g, '\'\\\'\'')}'`;
  }

  static _posix(file) {
    return file.replace(/\\/g, '/');
  }
}

module.exports = ShellIntegrationFiles;
