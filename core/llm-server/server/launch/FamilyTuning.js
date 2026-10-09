const ModelFamilies = require('../ModelFamilies');

class FamilyTuning {
  static resolve({ files, flags, spec, offload }) {
    return {
      tuning: ModelFamilies.launchArgs(files.family, flags.unsupported),
      drafterSpec: spec.dflashEnabled
        ? ModelFamilies.speculativeArgs(files.family, {
          drafterPath: files.drafterPath, flagsSupported: true, gpuOffload: offload.ngl > 0, dialect: flags.specDialect,
        })
        : null,
    };
  }
}

module.exports = FamilyTuning;
