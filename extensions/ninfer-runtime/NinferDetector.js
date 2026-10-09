const fs = require('fs');
const CoreRequire = require('./CoreRequire');
const NinferManifest = require('./NinferManifest');
const NinferShell = require('./NinferShell');

const Wsl = CoreRequire.load('music-server/runtimes/Wsl');
const WslFormat = CoreRequire.load('music-server/runtimes/WslFormat');

class NinferDetector {
  static async detect({ managedDir }, platform = process.platform) {
    const manifest = NinferManifest.read(managedDir);
    if (!manifest || !manifest.binPath) return { installed: false };
    if (manifest.mode === 'wsl') return NinferDetector._detectInWsl(manifest, platform);
    return NinferDetector._detectNative(manifest);
  }

  static async _detectInWsl(manifest, platform) {
    if (platform !== 'win32') return { installed: false, manifest, error: 'manifest is for WSL mode' };
    const r = await Wsl.runInWsl(manifest.distro, `test -x ${WslFormat.shellQuote(manifest.binPath)} && echo ok`, { timeout: NinferShell.PROBE_TIMEOUT_MS });
    if (!r.ok || !/ok/.test(String(r.stdout || ''))) {
      return { installed: false, manifest, error: `binary missing inside WSL (${manifest.distro}): ${manifest.binPath}` };
    }
    return NinferDetector._installed(manifest);
  }

  static _detectNative(manifest) {
    try {
      fs.accessSync(manifest.binPath, fs.constants.X_OK);
    } catch (_) {
      return { installed: false, manifest, error: `binary missing: ${manifest.binPath}` };
    }
    return NinferDetector._installed(manifest);
  }

  static _installed(manifest) {
    return { installed: true, source: 'managed', binaryPath: manifest.binPath, version: manifest.version || null, manifest };
  }
}

module.exports = NinferDetector;
