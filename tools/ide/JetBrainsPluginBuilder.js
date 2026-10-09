const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const IdeWebviewFiles = require('./IdeWebviewFiles');
const JetBrainsIdeFinder = require('./JetBrainsIdeFinder');
const JavaHomeFinder = require('./JavaHomeFinder');
const ZipExtractor = require('./ZipExtractor');
const FileTree = require('./FileTree');
const BuildSidecar = require('./BuildSidecar');

class JetBrainsPluginBuilder {
  static BY = 'scripts/build-jetbrains-plugin.js';
  static BUILD_OUTPUT = ['build', '.gradle', '.kotlin', '.intellijPlatform'];
  static NO_JAVA = 'no JDK found (set JAVA_HOME, or install a JetBrains IDE whose runtime can be used); the JetBrains plugin will not be bundled';

  constructor(root, { env = process.env, platform = process.platform, log, error } = {}) {
    this._root = root;
    this._env = env;
    this._platform = platform;
    this._log = log || ((m) => process.stdout.write(`[jetbrains] ${m}\n`));
    this._error = error || ((m) => console.error(`[jetbrains] ${m}`));
    this._pluginDir = path.join(root, 'ide', 'jetbrains');
    this._distDir = path.join(root, 'ide', 'dist');
    this._outDir = path.join(this._distDir, 'luma-jetbrains');
    this._webviewDir = path.join(this._pluginDir, 'src', 'main', 'resources', 'webview');
    this._sidecar = new BuildSidecar(path.join(this._distDir, 'jetbrains.json'));
  }

  execute(args) {
    const flags = new Set(args);
    this._version = JSON.parse(fs.readFileSync(path.join(this._root, 'package.json'), 'utf8')).version;
    this.syncPage();
    if (flags.has('--skip')) return 0;
    if (!flags.has('--force') && this._isUpToDate()) { this._log(`up to date (v${this._version}); --force to rebuild`); return 0; }
    const ides = JetBrainsIdeFinder.installed({ platform: this._platform, env: this._env });
    const java = JavaHomeFinder.find(ides, { platform: this._platform, env: this._env });
    if (!java) return this._noJava(flags.has('--require'));
    this._log(`java: ${java.home} (${java.source})`);
    const ideHome = this._env.LUMA_IDE_HOME || (ides.length ? ides[0].home : null);
    if (!this._gradleBuild(java, ideHome)) return 1;
    return this._unpack(ideHome);
  }

  syncPage() {
    const count = IdeWebviewFiles.syncPage(this._root, this._webviewDir, JetBrainsPluginBuilder.BY);
    this._log(`webview files synced (${count})`);
  }

  _isUpToDate() {
    if (!fs.existsSync(path.join(this._outDir, 'lib'))) return false;
    return this._sidecar.isUpToDate(this._version, this._sourceMtime());
  }

  _sourceMtime() {
    return FileTree.newestMtime(this._pluginDir, JetBrainsPluginBuilder.BUILD_OUTPUT);
  }

  _noJava(required) {
    if (required) { this._error(JetBrainsPluginBuilder.NO_JAVA); return 1; }
    this._log(JetBrainsPluginBuilder.NO_JAVA);
    return 0;
  }

  _gradleBuild(java, ideHome) {
    const env = { ...this._env, JAVA_HOME: java.home };
    if (ideHome) { env.LUMA_IDE_HOME = ideHome; this._log(`platform: ${ideHome}`); } else this._log('platform: IntelliJ CE from the JetBrains repository (download)');
    const win = this._platform === 'win32';
    const gradlew = path.join(this._pluginDir, win ? 'gradlew.bat' : 'gradlew');
    const args = ['buildPlugin', `-PpluginVersion=${this._version}`, '--no-daemon', '--console=plain', '-q'];
    this._log(`gradlew ${args.join(' ')}`);
    const r = win
      ? spawnSync(gradlew, args, { cwd: this._pluginDir, env, stdio: 'inherit', shell: true })
      : spawnSync('sh', [gradlew, ...args], { cwd: this._pluginDir, env, stdio: 'inherit' });
    if (r.error) this._error(`failed to start gradlew: ${r.error.message}`);
    if (r.status === 0) return true;
    this._error(`gradle build failed (exit ${r.status})`);
    return false;
  }

  _unpack(ideHome) {
    const zip = this._newestZip();
    if (!zip) { this._error('no plugin zip produced'); return 1; }
    const tmp = path.join(this._distDir, '.unpack');
    ZipExtractor.extract(zip, tmp, { platform: this._platform });
    const top = fs.readdirSync(tmp).map((n) => path.join(tmp, n)).find((p) => fs.statSync(p).isDirectory());
    if (!top || !fs.existsSync(path.join(top, 'lib'))) { this._error('unexpected zip layout'); return 1; }
    fs.rmSync(this._outDir, { recursive: true, force: true });
    fs.renameSync(top, this._outDir);
    fs.rmSync(tmp, { recursive: true, force: true });
    fs.copyFileSync(zip, path.join(this._distDir, 'luma-jetbrains.zip'));
    this._sidecar.write({ version: this._version, ide: ideHome ? path.basename(ideHome) : 'IC', sourceMtime: this._sourceMtime() });
    this._log(`built ${path.relative(this._root, this._outDir)} (v${this._version}); zip at ide/dist/luma-jetbrains.zip`);
    return 0;
  }

  _newestZip() {
    const dir = path.join(this._pluginDir, 'build', 'distributions');
    if (!fs.existsSync(dir)) return null;
    return fs.readdirSync(dir).filter((f) => f.endsWith('.zip')).map((f) => path.join(dir, f))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0] || null;
  }
}

module.exports = JetBrainsPluginBuilder;
