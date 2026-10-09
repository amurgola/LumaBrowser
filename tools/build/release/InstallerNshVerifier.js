const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

class InstallerNshVerifier {
  static FLAGS = ['updated', 'force-run', 'keep-shortcuts', 'no-desktop-shortcut', 'delete-app-data', 'allusers', 'currentuser'];
  static PASSES = [{ label: 'installer', args: [] }, { label: 'uninstaller', args: ['-DBUILD_UNINSTALLER'] }];

  constructor({ repoRoot, cacheDir = InstallerNshVerifier.defaultCacheDir(), spawn = spawnSync, log = console.log, error = console.error }) {
    this._repoRoot = repoRoot;
    this._cacheDir = cacheDir;
    this._spawn = spawn;
    this._log = log;
    this._error = error;
  }

  static defaultCacheDir() {
    return process.platform === 'win32'
      ? path.join(process.env.LOCALAPPDATA || '', 'electron-builder', 'Cache', 'nsis')
      : path.join(os.homedir(), '.cache', 'electron-builder', 'nsis');
  }

  run() {
    const makensis = this._findMakensis();
    if (!makensis) return this._missing('makensis not found in the electron-builder cache; run one packaged build first.');
    const plugins = this._findResourcePlugins();
    if (!plugins) return this._missing('nsis-resources (StdUtils plugin) not found in the electron-builder cache.');
    const work = fs.mkdtempSync(path.join(os.tmpdir(), 'luma-nsh-'));
    try {
      const nsi = path.join(work, 'harness.nsi');
      fs.writeFileSync(nsi, this.harnessScript(plugins, path.join(work, 'out.exe')));
      return InstallerNshVerifier.PASSES.every((pass) => this._compilePass(makensis, nsi, pass)) ? 0 : 1;
    } finally {
      fs.rmSync(work, { recursive: true, force: true });
    }
  }

  harnessScript(resourcePlugins, outExe) {
    const include = path.join(this._repoRoot, 'build', 'installer.nsh');
    const templates = path.join(this._repoRoot, 'node_modules', 'app-builder-lib', 'templates', 'nsis');
    return [
      'Unicode true',
      `!addincludedir "${path.join(templates, 'include')}"`,
      `!addplugindir "${resourcePlugins}"`,
      '!include "StdUtils.nsh"',
      InstallerNshVerifier.flagMacros(),
      `!include "${InstallerNshVerifier._nsisPath(include)}"`,
      '!include "MUI2.nsh"',
      'Name "LumaBrowser"',
      `OutFile "${InstallerNshVerifier._nsisPath(outExe)}"`,
      'InstallDir "$LOCALAPPDATA\\Programs\\LumaBrowser"',
      '!insertmacro MUI_PAGE_DIRECTORY',
      '!ifmacrodef customPageAfterChangeDir',
      '  !insertmacro customPageAfterChangeDir',
      '!endif',
      '!insertmacro MUI_PAGE_INSTFILES',
      '!insertmacro MUI_UNPAGE_INSTFILES',
      '!insertmacro MUI_LANGUAGE "English"',
      'Section "Install"',
      '  WriteUninstaller "$INSTDIR\\Uninstall.exe"',
      '!ifndef BUILD_UNINSTALLER',
      '  !ifmacrodef customInstall',
      '    !insertmacro customInstall',
      '  !endif',
      '!endif',
      'SectionEnd',
      '!ifdef BUILD_UNINSTALLER',
      'Section "Uninstall"',
      '  !ifmacrodef customUnInstall',
      '    !insertmacro customUnInstall',
      '  !endif',
      'SectionEnd',
      '!endif',
      '',
    ].join('\n');
  }

  static flagMacros() {
    return InstallerNshVerifier.FLAGS.map((flag) => {
      const name = `is${flag.replace(/(^|-)(\w)/g, (_m, _s, c) => c.toUpperCase())}`;
      return `!macro _${name} _a _b _t _f\n  \${StdUtils.TestParameter} $R9 "${flag}"\n`
        + `  StrCmp "$R9" "true" \`\${_t}\` \`\${_f}\`\n!macroend\n!define ${name} \`"" ${name} ""\``;
    }).join('\n');
  }

  static _nsisPath(p) {
    return p.replace(/\\/g, '\\\\');
  }

  _compilePass(makensis, nsi, { label, args }) {
    const argv = ['-WX', '-V2', '-DVERSION=0.0.0', '-DAPP_EXECUTABLE_FILENAME=LumaBrowser.exe', ...args, nsi];
    const result = this._spawn(makensis, argv, { encoding: 'utf8' });
    if (result.status === 0) {
      this._log(`[${label}] ok`);
      return true;
    }
    this._error(`[${label}] makensis failed (${result.status})\n${result.stdout || ''}${result.stderr || ''}`);
    return false;
  }

  _findMakensis() {
    const exe = process.platform === 'win32' ? path.join('Bin', 'makensis.exe') : path.join('bin', 'makensis');
    return InstallerNshVerifier._subdirs(this._cacheDir).map((d) => path.join(this._cacheDir, d, exe)).find((p) => fs.existsSync(p)) || null;
  }

  _findResourcePlugins() {
    const root = this._cacheDir;
    return InstallerNshVerifier._subdirs(root)
      .filter((d) => d.startsWith('nsis-resources'))
      .map((d) => path.join(root, d, 'plugins', 'x86-unicode'))
      .find((p) => fs.existsSync(p)) || null;
  }

  static _subdirs(dir) {
    try { return fs.readdirSync(dir); } catch (_) { return []; }
  }

  _missing(message) {
    this._error(message);
    return 2;
  }
}

module.exports = InstallerNshVerifier;
