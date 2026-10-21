const fs = require('fs');
const path = require('path');

class VolumeFreeSpace {
  static MAX_ANCESTOR_STEPS = 8;

  static async read(dir, { statfs = (p) => fs.promises.statfs(p) } = {}) {
    try {
      const stats = await statfs(VolumeFreeSpace.nearestExisting(dir));
      return { freeBytes: Number(stats.bavail) * Number(stats.bsize), totalBytes: Number(stats.blocks) * Number(stats.bsize) };
    } catch (_) {
      return { freeBytes: null, totalBytes: null };
    }
  }

  static nearestExisting(dir) {
    let probe = path.resolve(dir);
    for (let i = 0; i < VolumeFreeSpace.MAX_ANCESTOR_STEPS && !fs.existsSync(probe); i++) {
      const up = path.dirname(probe);
      if (up === probe) break;
      probe = up;
    }
    return probe;
  }
}

module.exports = VolumeFreeSpace;
