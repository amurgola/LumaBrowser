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

  static async wipeContents(dir) {
    if (!(await BinaryLookup.pathExists(dir))) return;
    for (const entry of await fs.promises.readdir(dir, { withFileTypes: true })) {
      try {
        await fs.promises.rm(path.join(dir, entry.name), { recursive: true, force: true });
      } catch (_) {}
    }
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
