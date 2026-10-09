const AddonModelSetup = require('../models/AddonModelSetup');
const GgufModelGrouper = require('./GgufModelGrouper');

class AddonModelBuilder {
  static build(files, rootDir, readSidecar = (weightsPath) => AddonModelSetup.readSidecar(weightsPath)) {
    return files.map((file) => AddonModelBuilder._model(file, rootDir, readSidecar(file.path)));
  }

  static _model(file, rootDir, sidecar) {
    const stem = file.name.replace(/\.[^.]+$/, '');
    return {
      kind: (sidecar && sidecar.kind) || file.defaultKind,
      name: (sidecar && sidecar.label) || stem,
      directory: file.directory,
      relativeDirectory: GgufModelGrouper.relativeDirectory(rootDir, file.directory),
      weights: [{ path: file.path, name: file.name, sizeBytes: file.sizeBytes, shardIndex: null, shardTotal: null }],
      weightsCount: 1,
      weightsExpectedShards: 1,
      weightsTotalBytes: file.sizeBytes,
      mmproj: [],
      mmprojTotalBytes: 0,
      totalBytes: file.sizeBytes,
      sidecars: [],
      gguf: null,
      addon: AddonModelBuilder._addonFacts(sidecar),
    };
  }

  static _addonFacts(sidecar) {
    const s = sidecar || {};
    return {
      id: s.id || null,
      requiresRuntime: s.requiresRuntime || null,
      contextLength: Number(s.contextLength) || null,
      defaultContextSize: Number(s.defaultContextSize) || null,
      quant: s.quant || null,
      modelId: s.modelId || null,
      hasSidecar: !!sidecar,
    };
  }
}

module.exports = AddonModelBuilder;
