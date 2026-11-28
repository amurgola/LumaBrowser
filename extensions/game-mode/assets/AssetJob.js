const GameSnapshot = require('../session/GameSnapshot');

class AssetJob {
  static fromSpec(spec, modelRef) {
    return {
      rel: spec.rel, abs: spec.abs, prompt: spec.fullPrompt,
      width: spec.genW, height: spec.genH, outW: spec.width, outH: spec.height,
      logicalW: spec.logicalW, logicalH: spec.logicalH, pixelScale: spec.pixelScale,
      pixel: spec.isPixel, alpha: spec.wantAlpha, rdFlow: !!spec.rdFlow, palette: spec.palette || null,
      ...(modelRef ? { modelRef } : {}),
    };
  }

  static request(job) {
    return {
      prompt: job.prompt, width: job.width, height: job.height,
      ...(job.modelRef ? { modelRef: job.modelRef } : {}),
      ...(job.rdFlow ? { opaqueBackground: !job.alpha, ...(job.palette ? { palette: job.palette } : {}) } : {}),
    };
  }

  static mark(s, rel, status, emit) {
    s.assets.set(rel, { status });
    GameSnapshot.emit(emit, s);
  }
}

module.exports = AssetJob;
