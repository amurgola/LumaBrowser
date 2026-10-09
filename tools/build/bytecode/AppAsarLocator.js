const BuildFs = require('../BuildFs');
const path = require('path');

const fs = BuildFs.get();

class AppAsarLocator {
  static find(appOutDir, productName) {
    const candidates = [
      path.join(appOutDir, 'resources', 'app.asar'),
      ...(productName ? [AppAsarLocator._macAsar(appOutDir, `${productName}.app`)] : []),
      ...AppAsarLocator._appBundles(appOutDir).map((bundle) => AppAsarLocator._macAsar(appOutDir, bundle)),
    ];
    return candidates.find((p) => fs.existsSync(p)) || null;
  }

  static _macAsar(appOutDir, bundle) {
    return path.join(appOutDir, bundle, 'Contents', 'Resources', 'app.asar');
  }

  static _appBundles(appOutDir) {
    try {
      return fs.readdirSync(appOutDir, { withFileTypes: true })
        .filter((e) => e.isDirectory() && e.name.endsWith('.app'))
        .map((e) => e.name);
    } catch (_) {
      return [];
    }
  }
}

module.exports = AppAsarLocator;
