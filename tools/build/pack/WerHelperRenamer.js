const BuildFs = require('../BuildFs');
const path = require('path');

const fs = BuildFs.get();

class WerHelperRenamer {
  static SOURCE = 'electron_wer.dll';
  static SUFFIX = '_wer.dll';

  constructor({ log = console.log } = {}) {
    this._log = log;
  }

  rename(context) {
    const product = WerHelperRenamer._productFilename(context);
    if (context.electronPlatformName !== 'win32' || !product) return null;
    const source = path.join(context.appOutDir, WerHelperRenamer.SOURCE);
    if (!fs.existsSync(source)) return null;
    const name = `${product}${WerHelperRenamer.SUFFIX}`;
    fs.renameSync(source, path.join(context.appOutDir, name));
    this._log(`[wer] ${WerHelperRenamer.SOURCE} -> ${name}`);
    return name;
  }

  static _productFilename(context) {
    const appInfo = context.packager && context.packager.appInfo;
    return (appInfo && appInfo.productFilename) || '';
  }
}

module.exports = WerHelperRenamer;
