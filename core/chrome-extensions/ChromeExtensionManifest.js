const fs = require('fs');
const path = require('path');

class ChromeExtensionManifest {
  static FILE_NAME = 'manifest.json';
  static COMMENT_PATTERN = /\/\*[\s\S]*?\*\/|(^|\s)\/\/.*$/gm;

  static read(dirPath) {
    const manifestPath = path.join(dirPath, ChromeExtensionManifest.FILE_NAME);
    if (!fs.existsSync(manifestPath)) throw new Error(`manifest.json not found in ${dirPath}`);
    return ChromeExtensionManifest.parse(fs.readFileSync(manifestPath, 'utf8'));
  }

  static parse(raw) {
    try {
      return JSON.parse(ChromeExtensionManifest.stripComments(raw));
    } catch (err) {
      throw new Error(`Invalid manifest.json: ${err.message}`);
    }
  }

  static stripComments(raw) {
    return String(raw).replace(ChromeExtensionManifest.COMMENT_PATTERN, '$1');
  }
}

module.exports = ChromeExtensionManifest;
