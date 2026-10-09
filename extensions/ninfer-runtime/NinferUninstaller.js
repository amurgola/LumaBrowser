const fs = require('fs');
const CoreRequire = require('./CoreRequire');
const NinferManifest = require('./NinferManifest');

const Wsl = CoreRequire.load('music-server/runtimes/Wsl');
const WslFormat = CoreRequire.load('music-server/runtimes/WslFormat');

class NinferUninstaller {
  static WSL_TIMEOUT_MS = 60000;

  static async uninstall({ managedDir }, platform = process.platform) {
    const manifest = NinferManifest.read(managedDir);
    if (manifest && manifest.mode === 'wsl' && manifest.installDir && platform === 'win32') {
      await NinferUninstaller._removeInWsl(manifest);
    }
    try { fs.rmSync(managedDir, { recursive: true, force: true }); } catch (_) {}
  }

  static async _removeInWsl(manifest) {
    const q = WslFormat.shellQuote;
    try {
      await Wsl.runInWsl(manifest.distro, `rm -rf ${q(manifest.installDir)} ${q(manifest.installDir + '-src')}`, { timeout: NinferUninstaller.WSL_TIMEOUT_MS });
    } catch (_) {}
  }
}

module.exports = NinferUninstaller;
