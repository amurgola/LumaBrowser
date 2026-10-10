const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

class MacDevApp {
  static NAME = 'LumaBrowser Dev';

  static prepare(electronPath, rootDir) {
    const source = path.resolve(electronPath, '../../..');
    const icon = path.join(rootDir, 'icon', 'icon.png');
    const key = MacDevApp.cacheKey(source, icon);
    const cache = path.join(rootDir, '.cache', 'mac-dev-app', key);
    const bundle = path.join(cache, `${MacDevApp.NAME}.app`);
    const executable = path.join(bundle, 'Contents', 'MacOS', path.basename(electronPath));
    if (fs.existsSync(path.join(cache, '.ready')) && fs.existsSync(executable)) return executable;

    const staging = `${cache}-${process.pid}`;
    fs.mkdirSync(staging, { recursive: true });
    try {
      const stagedBundle = path.join(staging, `${MacDevApp.NAME}.app`);
      fs.cpSync(source, stagedBundle, { recursive: true, verbatimSymlinks: true, mode: fs.constants.COPYFILE_FICLONE });
      MacDevApp.brand(stagedBundle, icon, staging);
      fs.writeFileSync(path.join(staging, '.ready'), key);
      fs.mkdirSync(path.dirname(cache), { recursive: true });
      try {
        fs.renameSync(staging, cache);
      } catch (err) {
        // Another launcher may have finished preparing the same runtime first.
        if (!fs.existsSync(path.join(cache, '.ready'))) throw err;
      }
      return executable;
    } finally {
      fs.rmSync(staging, { recursive: true, force: true });
    }
  }

  static cacheKey(source, icon) {
    const hash = crypto.createHash('sha256');
    hash.update(source);
    hash.update(fs.readFileSync(path.join(source, 'Contents', 'Info.plist')));
    hash.update(fs.readFileSync(icon));
    hash.update(fs.readFileSync(__filename));
    return hash.digest('hex').slice(0, 16);
  }

  static brand(bundle, icon, staging, run = execFileSync) {
    const plist = path.join(bundle, 'Contents', 'Info.plist');
    for (const [key, value] of Object.entries({
      CFBundleName: MacDevApp.NAME,
      CFBundleDisplayName: MacDevApp.NAME,
      CFBundleIdentifier: 'com.lumabyte.lumabrowser.dev',
      CFBundleIconFile: 'lumabrowser.icns',
    })) run('/usr/bin/plutil', ['-replace', key, '-string', value, plist]);
    MacDevApp.createIcon(icon, staging, path.join(bundle, 'Contents', 'Resources', 'lumabrowser.icns'), run);
    // Re-sign only the copied outer bundle; preserve Electron's runtime entitlements.
    run('/usr/bin/codesign', ['--force', '--sign', '-', '--preserve-metadata=entitlements,requirements,flags', bundle]);
  }

  static createIcon(icon, staging, output, run = execFileSync) {
    const iconset = path.join(staging, 'LumaBrowser.iconset');
    fs.mkdirSync(iconset, { recursive: true });
    for (const size of [16, 32, 128, 256, 512]) {
      for (const scale of [1, 2]) {
        const pixels = String(size * scale);
        const name = `icon_${size}x${size}${scale === 2 ? '@2x' : ''}.png`;
        run('/usr/bin/sips', ['-z', pixels, pixels, icon, '--out', path.join(iconset, name)]);
      }
    }
    run('/usr/bin/iconutil', ['-c', 'icns', iconset, '-o', output]);
    fs.rmSync(iconset, { recursive: true, force: true });
  }
}

module.exports = MacDevApp;
