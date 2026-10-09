const fs = require('fs');
const path = require('path');

class SherpaRuntimeLayout {
  static VERSION = '1.13.8';

  static DIR_NAME = 'tts-sherpa';
  static ADDON_PACKAGE = 'sherpa-onnx-node';
  static SUPPORTED_PLATFORMS = ['win-x64', 'linux-x64', 'linux-arm64', 'darwin-x64', 'darwin-arm64'];

  static platformPackageName() {
    const platform = process.platform === 'win32' ? 'win' : process.platform;
    const key = `${platform}-${process.arch}`;
    return SherpaRuntimeLayout.SUPPORTED_PLATFORMS.includes(key) ? `sherpa-onnx-${key}` : null;
  }

  static tarballUrl(packageName, version) {
    return `https://registry.npmjs.org/${packageName}/-/${packageName}-${version}.tgz`;
  }

  static runtimeDir(runtimesRoot) {
    return path.join(runtimesRoot, SherpaRuntimeLayout.DIR_NAME);
  }

  static addonDir(runtimesRoot) {
    return path.join(SherpaRuntimeLayout._nodeModules(runtimesRoot), SherpaRuntimeLayout.ADDON_PACKAGE);
  }

  static platformDir(runtimesRoot) {
    const packageName = SherpaRuntimeLayout.platformPackageName();
    return packageName ? path.join(SherpaRuntimeLayout._nodeModules(runtimesRoot), packageName) : null;
  }

  static manifestPath(runtimesRoot) {
    return path.join(SherpaRuntimeLayout.runtimeDir(runtimesRoot), 'manifest.json');
  }

  static isInstalled(runtimesRoot) {
    const platformDir = SherpaRuntimeLayout.platformDir(runtimesRoot);
    if (!platformDir) return false;
    try {
      return fs.existsSync(path.join(SherpaRuntimeLayout.addonDir(runtimesRoot), 'sherpa-onnx.js'))
        && fs.existsSync(path.join(platformDir, 'sherpa-onnx.node'));
    } catch (_) {
      return false;
    }
  }

  static installedVersion(runtimesRoot) {
    try {
      const manifest = JSON.parse(fs.readFileSync(SherpaRuntimeLayout.manifestPath(runtimesRoot), 'utf8'));
      return manifest.version || null;
    } catch (_) {
      return null;
    }
  }

  static _nodeModules(runtimesRoot) {
    return path.join(SherpaRuntimeLayout.runtimeDir(runtimesRoot), 'node_modules');
  }
}

module.exports = SherpaRuntimeLayout;
