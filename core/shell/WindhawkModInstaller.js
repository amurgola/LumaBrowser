const fs = require('fs');
const path = require('path');
const WindhawkLocator = require('./windhawk/WindhawkLocator');
const WindhawkRegistry = require('./windhawk/WindhawkRegistry');
const WindhawkCompiler = require('./windhawk/WindhawkCompiler');
const WindhawkElevation = require('./windhawk/WindhawkElevation');
const WindhawkModSource = require('./windhawk/WindhawkModSource');

class WindhawkModInstaller {
  static ID_PREFIX = 'local@';
  static MOD_SUFFIX = '.wh.cpp';
  static SUPPORTED_MAJOR = 1;
  static TESTED_VERSIONS = /^1\.7\./;
  static ARCH_FOLDERS = ['32', '64', 'arm64'];
  static UNLOAD_WAIT_MS = 1500;
  static UNLOAD_RETRY_MS = 8000;
  static TEMPLATE_IDS = new Set(['luma-desktop-ping']);

  constructor({ modsDir, platform = process.platform, locator, registry, elevation, compilerFor, fsOps = fs, now = () => Date.now() } = {}) {
    if (!modsDir) throw new Error('WindhawkModInstaller requires modsDir');
    this.modsDir = modsDir;
    this.platform = platform;
    this._locator = locator || new WindhawkLocator({ platform });
    this._registry = registry || new WindhawkRegistry();
    this._elevation = elevation || new WindhawkElevation();
    this._compilerFor = compilerFor || ((install) => new WindhawkCompiler(install));
    this._fs = fsOps;
    this._now = now;
  }

  available() {
    return this._bundled().length > 0;
  }

  sourceVersion() {
    return null;
  }

  async status() {
    const windhawk = this._windhawk();
    const mods = this._bundled();
    const installed = windhawk.supported ? await this._registry.readMods(windhawk.registryKey) : {};
    return {
      available: mods.length > 0,
      windhawk,
      emptyReason: windhawk.supported ? null : windhawk.reason || null,
      summary: windhawk.found ? `Windhawk ${windhawk.version || ''} found${windhawk.tested ? '' : ' (not yet tested with this installer)'}.`.replace('  ', ' ') : null,
      sourceVersion: null,
      ides: windhawk.supported ? mods.map((m) => this._row(m, installed[WindhawkModInstaller.ID_PREFIX + m.header.id])) : [],
    };
  }

  async install(ids) {
    const windhawk = this._requireWindhawk();
    const chosen = this._choose(ids, { forInstall: true });
    const installed = await this._registry.readMods(windhawk.registryKey);
    const failed = [];
    const builds = [];
    try {
      for (const mod of chosen) {
        try {
          builds.push(await this._build(windhawk, mod, installed[WindhawkModInstaller.ID_PREFIX + mod.header.id]));
        } catch (err) {
          failed.push({ id: mod.header.id, error: (err && err.message) || 'compile failed' });
        }
      }
      const done = await this._applyAll(builds, failed, (b) => b.ops);
      return { installed: done, failed, ides: (await this.status()).ides };
    } finally {
      for (const b of builds) { try { this._fs.rmSync(b.dir, { recursive: true, force: true }); } catch (_) {} }
    }
  }

  async uninstall(ids) {
    const windhawk = this._requireWindhawk();
    const installed = await this._registry.readMods(windhawk.registryKey);
    const targets = this._choose(ids).filter((m) => installed[WindhawkModInstaller.ID_PREFIX + m.header.id]);
    const failed = [];
    const plans = targets.map((m) => ({ id: m.header.id, ops: this._removeOps(windhawk, WindhawkModInstaller.ID_PREFIX + m.header.id) }));
    const done = await this._applyAll(plans, failed, (p) => p.ops, true);
    return { removed: done, failed, ides: (await this.status()).ides };
  }

  async refreshIfInstalled() {
    return [];
  }

  async _applyAll(items, failed, opsOf, waitForUnload = false) {
    if (!items.length) return [];
    const ops = items.flatMap(opsOf);
    if (waitForUnload) WindhawkModInstaller._moveCleanupLast(ops);
    const result = await this._elevation.apply(ops);
    if (result.ok) return items.map((i) => i.id);
    const why = result.canceled ? 'The administrator prompt was declined' : (result.errors[0] && result.errors[0].error) || 'The elevated step failed';
    for (const i of items) failed.push({ id: i.id, error: why });
    return [];
  }

  static _moveCleanupLast(ops) {
    const keys = ops.filter((o) => o.op === 'regDeleteKey');
    const rest = ops.filter((o) => o.op !== 'regDeleteKey');
    ops.splice(0, ops.length, ...keys, { op: 'sleep', ms: WindhawkModInstaller.UNLOAD_WAIT_MS, optional: true }, ...rest);
  }

  async _build(windhawk, mod, existing) {
    const modId = WindhawkModInstaller.ID_PREFIX + mod.header.id;
    const settings = { ...WindhawkModSource.initialSettings(mod.source), ...((existing && existing.settings) || {}) };
    const build = await this._compilerFor(windhawk).compile({ source: mod.source, header: mod.header, modId });
    const sourceCopy = path.join(build.dir, 'source.wh.cpp');
    this._fs.writeFileSync(sourceCopy, mod.source, 'utf8');
    return { id: mod.header.id, dir: build.dir, ops: this._installOps(windhawk, mod.header, modId, build, settings, existing, sourceCopy) };
  }

  _installOps(windhawk, header, modId, build, settings, existing, sourceCopy) {
    const key = `${windhawk.registryKey}\\Engine\\Mods\\${modId}`;
    const disabled = existing && existing.values && existing.values.Disabled ? 1 : 0;
    const ops = [];
    for (const out of build.outputs) {
      const dir = path.join(windhawk.engineModsDir, out.subfolder);
      ops.push({ op: 'mkdir', path: dir }, { op: 'copy', from: out.file, to: path.join(dir, build.dllName) });
    }
    ops.push({ op: 'regSetValues', key: `${key}\\Settings`, replace: true, values: WindhawkModInstaller._values(settings) });
    ops.push({
      op: 'regSetValues', key, replace: false, values: [
        { name: 'LibraryFileName', kind: 'string', data: build.dllName },
        { name: 'Disabled', kind: 'dword', data: disabled },
        { name: 'Include', kind: 'string', data: header.include.join('|') },
        { name: 'Exclude', kind: 'string', data: header.exclude.join('|') },
        { name: 'Architecture', kind: 'string', data: header.architectureField.join('|') },
        { name: 'Version', kind: 'string', data: header.version || '' },
        { name: 'SettingsChangeTime', kind: 'dword', data: Math.floor(this._now() / 1000) & 0x7FFFFFFF },
      ],
    });
    ops.push({ op: 'mkdir', path: windhawk.modsSourceDir }, { op: 'copy', from: sourceCopy, to: path.join(windhawk.modsSourceDir, modId + WindhawkModInstaller.MOD_SUFFIX) });
    for (const out of build.outputs) {
      ops.push({ op: 'deleteOldDlls', dir: path.join(windhawk.engineModsDir, out.subfolder), prefix: `${modId}_`, keep: build.dllName, optional: true });
    }
    return ops;
  }

  _removeOps(windhawk, modId) {
    const ops = [
      { op: 'regDeleteKey', key: `${windhawk.registryKey}\\Engine\\Mods\\${modId}` },
      { op: 'regDeleteKey', key: `${windhawk.registryKey}\\Engine\\ModsWritable\\${modId}`, optional: true },
      { op: 'deleteFile', path: path.join(windhawk.modsSourceDir, modId + WindhawkModInstaller.MOD_SUFFIX), optional: true },
      { op: 'deleteDir', path: path.join(windhawk.engineModsWritableDir, 'mod-storage', modId), optional: true },
    ];
    for (const sub of WindhawkModInstaller.ARCH_FOLDERS) {
      ops.push({ op: 'deleteOldDlls', dir: path.join(windhawk.engineModsDir, sub), prefix: `${modId}_`, keep: '', retryMs: WindhawkModInstaller.UNLOAD_RETRY_MS, optional: true });
    }
    return ops;
  }

  static _values(settings) {
    return Object.entries(settings).map(([name, value]) => (typeof value === 'number'
      ? { name, kind: 'dword', data: value }
      : { name, kind: 'string', data: String(value == null ? '' : value) }));
  }

  _row(mod, entry) {
    const values = (entry && entry.values) || {};
    const installed = !!values.LibraryFileName;
    const installedVersion = installed ? String(values.Version || '') || null : null;
    return {
      id: mod.header.id,
      label: mod.header.name || mod.header.id,
      description: mod.header.description || '',
      version: mod.header.version || null,
      installed,
      installedVersion,
      current: installed && installedVersion === (mod.header.version || null),
      enabled: installed && !values.Disabled,
      latest: true,
    };
  }

  _bundled() {
    let names = [];
    try { names = this._fs.readdirSync(this.modsDir); } catch (_) { return []; }
    const mods = [];
    for (const name of names.filter((n) => n.endsWith(WindhawkModInstaller.MOD_SUFFIX)).sort()) {
      try {
        const source = this._fs.readFileSync(path.join(this.modsDir, name), 'utf8');
        const header = WindhawkModSource.parse(source);
        if (header.id) mods.push({ file: name, source, header });
      } catch (_) {}
    }
    return mods;
  }

  _choose(ids, { forInstall = false } = {}) {
    const all = this._bundled();
    if (!Array.isArray(ids) || !ids.length) return forInstall ? all.filter((m) => !WindhawkModInstaller.TEMPLATE_IDS.has(m.header.id)) : all;
    const wanted = new Set(ids.map(String));
    return all.filter((m) => wanted.has(m.header.id));
  }

  _windhawk() {
    const found = this._locator.locate();
    if (!found.found) return { ...found, supported: false, tested: false };
    const major = found.version ? parseInt(found.version.split('.')[0], 10) : NaN;
    const tested = !!found.version && WindhawkModInstaller.TESTED_VERSIONS.test(found.version);
    if (found.portable) return { ...found, supported: false, tested, reason: 'Portable Windhawk keeps mod configs in ini files; install the mods from Windhawk itself.' };
    if (major !== WindhawkModInstaller.SUPPORTED_MAJOR) return { ...found, supported: false, tested, reason: `Windhawk ${found.version || '(unknown version)'} is not supported by this installer.` };
    if (!this._fs.existsSync(path.join(found.compilerDir, 'bin', 'clang++.exe'))) return { ...found, supported: false, tested, reason: 'Windhawk\'s compiler is missing from its install folder.' };
    return { ...found, supported: true, tested };
  }

  _requireWindhawk() {
    const windhawk = this._windhawk();
    if (!windhawk.supported) throw new Error(windhawk.reason || 'Windhawk was not found.');
    return windhawk;
  }
}

module.exports = WindhawkModInstaller;
