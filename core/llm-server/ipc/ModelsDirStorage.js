const fs = require('fs');
const path = require('path');

class ModelsDirStorage {
  static MAX_ANCESTOR_STEPS = 8;

  static async freeSpace(dir, { statfs = (p) => fs.promises.statfs(p) } = {}) {
    try {
      const stats = await statfs(ModelsDirStorage.nearestExisting(dir));
      return { freeBytes: Number(stats.bavail) * Number(stats.bsize), totalBytes: Number(stats.blocks) * Number(stats.bsize) };
    } catch (_) {
      return { freeBytes: null, totalBytes: null };
    }
  }

  static nearestExisting(dir) {
    let probe = path.resolve(dir);
    for (let i = 0; i < ModelsDirStorage.MAX_ANCESTOR_STEPS && !fs.existsSync(probe); i++) {
      const up = path.dirname(probe);
      if (up === probe) break;
      probe = up;
    }
    return probe;
  }
}

module.exports = ModelsDirStorage;
