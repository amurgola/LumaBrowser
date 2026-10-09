const path = require('path');
const VersionCompare = require('./VersionCompare');

class VscodeEditorLocator {
  static EDITORS = [
    {
      id: 'vscode', label: 'Visual Studio Code', cli: 'code', dataDir: '.vscode',
      win: ['%L\\Microsoft VS Code\\bin\\code.cmd', '%P\\Microsoft VS Code\\bin\\code.cmd'],
      mac: ['/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code'],
      linux: ['/usr/bin/code', '/usr/share/code/bin/code', '/snap/bin/code'],
    },
    {
      id: 'vscode-insiders', label: 'VS Code Insiders', cli: 'code-insiders', dataDir: '.vscode-insiders',
      win: ['%L\\Microsoft VS Code Insiders\\bin\\code-insiders.cmd', '%P\\Microsoft VS Code Insiders\\bin\\code-insiders.cmd'],
      mac: ['/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/bin/code-insiders'],
      linux: ['/usr/bin/code-insiders', '/usr/share/code-insiders/bin/code-insiders', '/snap/bin/code-insiders'],
    },
    {
      id: 'vscodium', label: 'VSCodium', cli: 'codium', dataDir: '.vscode-oss',
      win: ['%L\\VSCodium\\bin\\codium.cmd', '%P\\VSCodium\\bin\\codium.cmd'],
      mac: ['/Applications/VSCodium.app/Contents/Resources/app/bin/codium'],
      linux: ['/usr/bin/codium', '/usr/share/codium/bin/codium', '/snap/bin/codium'],
    },
    {
      id: 'cursor', label: 'Cursor', cli: 'cursor', dataDir: '.cursor',
      win: ['%L\\cursor\\resources\\app\\bin\\cursor.cmd', '%P\\cursor\\resources\\app\\bin\\cursor.cmd'],
      mac: ['/Applications/Cursor.app/Contents/Resources/app/bin/cursor'],
      linux: ['/usr/bin/cursor', '/opt/Cursor/resources/app/bin/cursor', '/usr/share/cursor/bin/cursor'],
    },
    {
      id: 'windsurf', label: 'Windsurf', cli: 'windsurf', dataDir: '.windsurf',
      win: ['%L\\Windsurf\\bin\\windsurf.cmd', '%P\\Windsurf\\bin\\windsurf.cmd'],
      mac: ['/Applications/Windsurf.app/Contents/Resources/app/bin/windsurf'],
      linux: ['/usr/bin/windsurf', '/usr/share/windsurf/bin/windsurf'],
    },
  ];

  constructor({ platform, homeDir, env, fsOps }) {
    this._platform = platform;
    this._homeDir = homeDir;
    this._env = env;
    this._fs = fsOps;
  }

  get _isWindows() {
    return this._platform === 'win32';
  }

  findCli(editor) {
    return this._knownLocation(editor) || this._onPath(editor);
  }

  extensionsDir(editor) {
    return path.join(this._homeDir, editor.dataDir, 'extensions');
  }

  installedVersion(editor, extensionId) {
    const dir = this.extensionsDir(editor);
    const prefix = `${extensionId}-`;
    let best = null;
    for (const name of this._listDir(dir)) {
      if (!name.toLowerCase().startsWith(prefix)) continue;
      const version = this._folderVersion(dir, name, prefix);
      if (!best || VersionCompare.compare(version, best) > 0) best = version;
    }
    return best;
  }

  _knownLocation(editor) {
    return this._candidates(editor).find((candidate) => this._isFile(candidate)) || null;
  }

  _candidates(editor) {
    if (this._isWindows) {
      const local = path.win32.join(this._env.LOCALAPPDATA || path.win32.join(this._homeDir, 'AppData', 'Local'), 'Programs');
      const programFiles = this._env.ProgramFiles || 'C:\\Program Files';
      return editor.win.map((t) => t.replace('%L', local).replace('%P', programFiles));
    }
    return this._platform === 'darwin' ? editor.mac : editor.linux;
  }

  _onPath(editor) {
    const separator = this._isWindows ? ';' : ':';
    const names = this._isWindows ? [`${editor.cli}.cmd`, `${editor.cli}.exe`] : [editor.cli];
    const join = this._isWindows ? path.win32.join : path.posix.join;
    for (const dir of String(this._env.PATH || this._env.Path || '').split(separator)) {
      if (!dir) continue;
      for (const name of names) {
        const candidate = join(dir, name);
        if (this._isFile(candidate)) return candidate;
      }
    }
    return null;
  }

  _folderVersion(dir, name, prefix) {
    try {
      const json = JSON.parse(this._fs.readFileSync(path.join(dir, name, 'package.json'), 'utf8'));
      if (json && json.version) return String(json.version);
    } catch (_) {}
    return name.slice(prefix.length);
  }

  _listDir(dir) {
    try { return this._fs.readdirSync(dir); } catch (_) { return []; }
  }

  _isFile(target) {
    try { return this._fs.statSync(target).isFile(); } catch (_) { return false; }
  }
}

module.exports = VscodeEditorLocator;
