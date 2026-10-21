const VolumeFreeSpace = require('../../shared/download/VolumeFreeSpace');

class ModelsDirStorage {
  static MAX_ANCESTOR_STEPS = VolumeFreeSpace.MAX_ANCESTOR_STEPS;

  static freeSpace(dir, options = {}) {
    return VolumeFreeSpace.read(dir, options);
  }

  static nearestExisting(dir) {
    return VolumeFreeSpace.nearestExisting(dir);
  }
}

module.exports = ModelsDirStorage;
