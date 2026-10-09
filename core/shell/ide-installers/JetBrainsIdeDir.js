const path = require('path');
const VersionCompare = require('./VersionCompare');

class JetBrainsIdeDir {
  static PRODUCTS = {
    IntelliJIdea: 'IntelliJ IDEA',
    IdeaIC: 'IntelliJ IDEA Community',
    IdeaIU: 'IntelliJ IDEA Ultimate',
    PyCharm: 'PyCharm',
    PyCharmCE: 'PyCharm Community',
    WebStorm: 'WebStorm',
    PhpStorm: 'PhpStorm',
    GoLand: 'GoLand',
    Rider: 'Rider',
    CLion: 'CLion',
    RubyMine: 'RubyMine',
    DataGrip: 'DataGrip',
    DataSpell: 'DataSpell',
    RustRover: 'RustRover',
    Aqua: 'Aqua',
    Writerside: 'Writerside',
    AndroidStudio: 'Android Studio',
  };

  static VENDORS = ['JetBrains', 'Google'];
  static DIR_PATTERN = /^([A-Za-z]+?)(\d{4}\.\d+(?:\.\d+)?)$/;

  static parse(name) {
    const match = JetBrainsIdeDir.DIR_PATTERN.exec(String(name || ''));
    if (!match) return null;
    const [, product, version] = match;
    if (!Object.prototype.hasOwnProperty.call(JetBrainsIdeDir.PRODUCTS, product)) return null;
    return { product, version, label: `${JetBrainsIdeDir.PRODUCTS[product]} ${version}` };
  }

  static compare(a, b) {
    if (a.product !== b.product) return a.label.localeCompare(b.label);
    return VersionCompare.compare(b.version, a.version);
  }

  static vendorRoots(platform, homeDir, appData) {
    if (platform === 'win32') return JetBrainsIdeDir._nestedPluginRoots(appData);
    if (platform === 'darwin') return JetBrainsIdeDir._nestedPluginRoots(path.join(homeDir, 'Library', 'Application Support'));
    return JetBrainsIdeDir.VENDORS.map((vendor) => ({
      configRoot: path.join(homeDir, '.config', vendor),
      pluginsRoot: path.join(homeDir, '.local', 'share', vendor),
      pluginsSubdir: '',
    }));
  }

  static pluginsDir(root, ideDirName) {
    return root.pluginsSubdir
      ? path.join(root.pluginsRoot, ideDirName, root.pluginsSubdir)
      : path.join(root.pluginsRoot, ideDirName);
  }

  static _nestedPluginRoots(base) {
    return JetBrainsIdeDir.VENDORS.map((vendor) => ({
      configRoot: path.join(base, vendor),
      pluginsRoot: path.join(base, vendor),
      pluginsSubdir: 'plugins',
    }));
  }
}

module.exports = JetBrainsIdeDir;
