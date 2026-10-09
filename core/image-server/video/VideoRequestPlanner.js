const ImageLoraSpecs = require('../router/ImageLoraSpecs');
const VideoConstraints = require('../VideoConstraints');

class VideoRequestPlanner {
  static DEFAULTS = Object.freeze({ width: 832, height: 480, steps: 20, cfgScale: 5.0, sampler: 'euler', fps: 16, videoFrames: 33 });

  static MAX_DURATION_SEC = 15;

  constructor({ lorasDir = null } = {}) {
    this._lorasDir = lorasDir;
  }

  plan({ request, model, wantId }) {
    const md = (model && model.defaults) || {};
    const params = this._effectiveParams(request, md);
    const norm = VideoConstraints.normalizeVideoRequest(params, model && model.constraints);
    Object.assign(params, { width: norm.width, height: norm.height, videoFrames: norm.videoFrames, fps: norm.fps });
    VideoRequestPlanner._logAdjustments(wantId, norm.adjustments);
    return { params, adjustments: norm.adjustments };
  }

  static metaFields(plan, i2v) {
    const p = plan.params;
    return {
      width: p.width,
      height: p.height,
      steps: p.steps,
      cfgScale: p.cfgScale,
      sampler: p.sampler,
      videoFrames: p.videoFrames,
      fps: p.fps,
      seed: p.seed,
      i2v: !!i2v,
      ...(plan.adjustments.length ? { adjustments: plan.adjustments } : {}),
    };
  }

  _effectiveParams(r, md) {
    const D = VideoRequestPlanner.DEFAULTS;
    const fps = VideoRequestPlanner.fps(r.fps, md.fps);
    return {
      prompt: r.prompt,
      negativePrompt: r.negativePrompt || md.negativePrompt || null,
      width: r.width || md.width || D.width,
      height: r.height || md.height || D.height,
      steps: r.steps || md.steps || D.steps,
      cfgScale: VideoRequestPlanner._number(r.cfgScale, md.cfgScale, D.cfgScale),
      sampler: r.sampler || md.sampler || D.sampler,
      scheduler: r.scheduler || md.scheduler || undefined,
      seed: typeof r.seed === 'number' ? r.seed : null,
      videoFrames: VideoRequestPlanner.frameCount(r, md, fps),
      fps,
      flowShift: VideoRequestPlanner._positive(r.flowShift) || VideoRequestPlanner._positive(md.flowShift) || undefined,
      ...VideoRequestPlanner._modelOnlyKnobs(md),
      loras: ImageLoraSpecs.resolve(md, this._lorasDir),
      firstFrame: r.firstFrame || null,
      lastFrame: r.lastFrame || null,
    };
  }

  static fps(requested, modelFps) {
    return VideoRequestPlanner._positive(requested) || VideoRequestPlanner._positive(modelFps) || VideoRequestPlanner.DEFAULTS.fps;
  }

  static frameCount(request, md, fps) {
    if (Number(request.videoFrames) > 0) return Math.floor(Number(request.videoFrames));
    if (Number(request.durationSec) > 0) {
      const seconds = Math.min(VideoRequestPlanner.MAX_DURATION_SEC, Number(request.durationSec));
      return Math.max(1, Math.round(seconds * fps));
    }
    if (Number(md.videoFrames) > 0) return Math.floor(Number(md.videoFrames));
    return VideoRequestPlanner.DEFAULTS.videoFrames;
  }

  static _modelOnlyKnobs(md) {
    const highNoiseSteps = VideoRequestPlanner._positive(md.highNoiseSteps);
    return {
      outputFormat: md.outputFormat || undefined,
      moeBoundary: VideoRequestPlanner._positive(md.moeBoundary) || undefined,
      highNoiseSteps: highNoiseSteps ? Math.floor(highNoiseSteps) : undefined,
      highNoiseCfgScale: typeof md.highNoiseCfgScale === 'number' ? md.highNoiseCfgScale : undefined,
      cacheMode: md.cacheMode || undefined,
      cacheOption: md.cacheOption || undefined,
    };
  }

  static _logAdjustments(wantId, adjustments) {
    if (!adjustments.length) return;
    const summary = adjustments.map((a) => `${a.field} ${a.from}→${a.to} (${a.reason})`).join(', ');
    console.log(`[video-server] "${wantId}" request adjusted to the model grid: ${summary}`);
  }

  static _positive(value) {
    return Number(value) > 0 ? Number(value) : 0;
  }

  static _number(requested, modelValue, fallback) {
    if (typeof requested === 'number') return requested;
    return typeof modelValue === 'number' ? modelValue : fallback;
  }
}

module.exports = VideoRequestPlanner;
