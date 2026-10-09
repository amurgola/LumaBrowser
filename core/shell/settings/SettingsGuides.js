const fs = require('fs');
const path = require('path');

class SettingsGuides {
  static FILES = { api: 'api-howto.md', default: 'extensions-guide.md' };
  static FOLDER = 'documentation';

  constructor(rootDir) {
    this._rootDir = rootDir;
  }

  read(guideType) {
    try {
      return { success: true, content: fs.readFileSync(this.pathFor(guideType), 'utf8') };
    } catch {
      return { success: false, error: 'Guide file not found' };
    }
  }

  pathFor(guideType) {
    const file = guideType === 'api' ? SettingsGuides.FILES.api : SettingsGuides.FILES.default;
    return path.join(this._rootDir, SettingsGuides.FOLDER, file);
  }
}

module.exports = SettingsGuides;
