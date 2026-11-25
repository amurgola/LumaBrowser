const fs = require('fs');
const path = require('path');
const IniFile = require('./IniFile');

class SystemImages {
  static PROPERTIES_FILE = 'source.properties';
  static PLAY_TAG = 'google_apis_playstore';

  constructor(imagesDir, { fileSystem = fs } = {}) {
    this._imagesDir = imagesDir;
    this._fs = fileSystem;
  }

  list() {
    const images = [];
    for (const api of this._folders(this._imagesDir)) {
      for (const tag of this._folders(path.join(this._imagesDir, api))) {
        for (const abi of this._folders(path.join(this._imagesDir, api, tag))) {
          const image = this._read(api, tag, abi);
          if (image) images.push(image);
        }
      }
    }
    return images.sort(SystemImages._newestPlayFirst);
  }

  _read(api, tag, abi) {
    const file = path.join(this._imagesDir, api, tag, abi, SystemImages.PROPERTIES_FILE);
    let properties;
    try { properties = IniFile.parse(this._fs.readFileSync(file, 'utf8')); } catch (_) { return null; }
    return {
      sysdir: `${['system-images', api, tag, abi].join(path.sep)}${path.sep}`,
      target: api,
      apiLevel: Number(properties['AndroidVersion.ApiLevel']) || 0,
      tag,
      label: properties['SystemImage.TagDisplay'] || tag,
      abi,
      playStore: tag === SystemImages.PLAY_TAG,
    };
  }

  _folders(dir) {
    try {
      return this._fs.readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    } catch (_) {
      return [];
    }
  }

  static _newestPlayFirst(first, second) {
    if (second.apiLevel !== first.apiLevel) return second.apiLevel - first.apiLevel;
    return Number(second.playStore) - Number(first.playStore);
  }
}

module.exports = SystemImages;
