const GameSnapshot = require('../session/GameSnapshot');

class AssetJob {
  static fromSpec(spec, modelRef) {
    return {
      rel: spec.rel, abs: spec.abs, prompt: spec.fullPrompt,
      width: spec.genW, height: spec.genH, outW: spec.width, outH: spec.height,
      logicalW: spec.logicalW, logicalH: spec.logicalH, pixelScale: spec.pixelScale,
      pixel: spec.isPixel, alpha: spec.wantAlpha, ...(modelRef ? { modelRef } : {}),
    };
  }

  static queue(s, spec, modelRef) {
    s.pendingAssets.push(AssetJob.fromSpec(spec, modelRef));
    s.assets.set(spec.rel, { status: 'pending' });
  }

  static request(job) {
    return { prompt: job.prompt, width: job.width, height: job.height, ...(job.modelRef ? { modelRef: job.modelRef } : {}) };
  }

  static mark(s, rel, status, emit) {
    s.assets.set(rel, { status });
    GameSnapshot.emit(emit, s);
  }
}

module.exports = AssetJob;
