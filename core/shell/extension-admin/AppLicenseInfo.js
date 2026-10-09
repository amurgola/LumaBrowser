const fs = require('fs');
const path = require('path');

class AppLicenseInfo {
  static read(rootDir) {
    const pkg = require(path.join(rootDir, 'package.json'));
    return {
      appLicense: AppLicenseInfo._textOrEmpty(path.join(rootDir, 'LICENSE')),
      thirdParty: AppLicenseInfo._textOrEmpty(path.join(rootDir, 'THIRD-PARTY-LICENSES')),
      version: pkg.version,
      name: pkg.productName || pkg.name,
    };
  }

  static _textOrEmpty(file) {
    try { return fs.readFileSync(file, 'utf8'); } catch (_) { return ''; }
  }
}

module.exports = AppLicenseInfo;
