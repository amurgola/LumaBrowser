const fs = require('fs');
const path = require('path');
const BinaryLookup = require('../BinaryLookup');

class ManagedDir {
  static STAGING_DIR = '.tmp';

  static pathFor(runtimesRoot, id) {
    return path.join(runtimesRoot, id);
  }

  static stagingPathFor(runtimesRoot, id, assetName, label = '') {
    const prefix = label ? `${id}-${label}` : id;
    return path.join(runtimesRoot, ManagedDir.STAGING_DIR, `${prefix}-${Date.now()}-${path.basename(assetName)}`);
  }

  static async ensure(dir) {
    await fs.promises.mkdir(dir, { recursive: true });
  }

  static async wipeContents(dir, { rm = ManagedDir._rm } = {}) {
    if (!(await BinaryLookup.pathExists(dir))) return [];
    const leftovers = [];
    for (const entry of await fs.promises.readdir(dir, { withFileTypes: true })) {
      try {
        await rm(path.join(dir, entry.name));
      } catch (_) {
        leftovers.push(entry.name);
      }
    }
    return leftovers;
  }

  static _rm(target) {
    return fs.promises.rm(target, { recursive: true, force: true });
  }

  static async remove(dir) {
    if (!(await BinaryLookup.pathExists(dir))) return false;
    await fs.promises.rm(dir, { recursive: true, force: true });
    return true;
  }

  static removeQuietly(filePath) {
    fs.promises.unlink(filePath).catch(() => {});
  }
}

module.exports = ManagedDir;
