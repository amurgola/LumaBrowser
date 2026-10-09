const fs = require('fs');
const path = require('path');
const GgufModelGrouper = require('./GgufModelGrouper');

class MlxModelBuilder {
  static build(mlxDirs, rootDir) {
    const out = [];
    for (const [dir, mlxDir] of mlxDirs) {
      if (!mlxDir.hasConfig || mlxDir.safetensors.length === 0) continue;
      out.push(MlxModelBuilder._model(dir, mlxDir, rootDir));
    }
    return out;
  }

  static readConfigFacts(configPath) {
    const facts = { quantization: null, architecture: null };
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (cfg && cfg.quantization && typeof cfg.quantization === 'object' && cfg.quantization.bits) {
        facts.quantization = `${cfg.quantization.bits}-bit`;
      }
      if (cfg && Array.isArray(cfg.architectures) && cfg.architectures[0]) {
        facts.architecture = String(cfg.architectures[0]);
      }
    } catch (_) {
    }
    return facts;
  }

  static _model(dir, mlxDir, rootDir) {
    const relativeDirectory = GgufModelGrouper.relativeDirectory(rootDir, dir);
    const name = relativeDirectory === '.' ? path.basename(rootDir) : path.basename(dir);
    const weightsTotalBytes = mlxDir.safetensors.reduce((sum, f) => sum + (f.sizeBytes || 0), 0);
    return {
      kind: 'mlx',
      name,
      directory: dir,
      relativeDirectory,
      weights: [{ path: dir, name, sizeBytes: weightsTotalBytes, shardIndex: null, shardTotal: null }],
      weightsCount: mlxDir.safetensors.length,
      weightsExpectedShards: 1,
      weightsTotalBytes,
      mmproj: [],
      mmprojTotalBytes: 0,
      totalBytes: weightsTotalBytes,
      sidecars: [],
      gguf: null,
      mlx: MlxModelBuilder.readConfigFacts(mlxDir.configPath),
    };
  }
}

module.exports = MlxModelBuilder;
