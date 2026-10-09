const ImageBytes = require('./ImageBytes');

class SdcppVideoBody {
  static DEFAULT_WIDTH = 832;
  static DEFAULT_HEIGHT = 480;
  static DEFAULT_FRAMES = 33;
  static DEFAULT_FPS = 16;
  static DEFAULT_STEPS = 20;
  static DEFAULT_CFG = 5.0;
  static DEFAULT_FORMAT = 'webm';

  static frameCount(videoFrames) {
    return Number(videoFrames) > 0 ? Math.floor(Number(videoFrames)) : SdcppVideoBody.DEFAULT_FRAMES;
  }

  static fps(fps) {
    return Number(fps) > 0 ? Number(fps) : SdcppVideoBody.DEFAULT_FPS;
  }

  static build(request) {
    const body = SdcppVideoBody._base(request);
    SdcppVideoBody._addOptional(body, request);
    SdcppVideoBody._addHighNoise(body, request);
    SdcppVideoBody._addFrames(body, request);
    return body;
  }

  static _base(request) {
    const { prompt, width, height, seed, videoFrames, fps, outputFormat } = request;
    return {
      prompt,
      width: width || SdcppVideoBody.DEFAULT_WIDTH,
      height: height || SdcppVideoBody.DEFAULT_HEIGHT,
      seed: typeof seed === 'number' && seed >= 0 ? seed : -1,
      video_frames: SdcppVideoBody.frameCount(videoFrames),
      fps: SdcppVideoBody.fps(fps),
      output_format: outputFormat || SdcppVideoBody.DEFAULT_FORMAT,
      sample_params: SdcppVideoBody._sampleParams(request),
    };
  }

  static _sampleParams({ steps, sampler, scheduler, cfgScale, flowShift }) {
    const params = {
      sample_steps: steps || SdcppVideoBody.DEFAULT_STEPS,
      sample_method: sampler || 'euler',
      ...(scheduler ? { scheduler } : {}),
      guidance: { txt_cfg: typeof cfgScale === 'number' ? cfgScale : SdcppVideoBody.DEFAULT_CFG },
    };
    if (Number(flowShift) > 0) params.flow_shift = Number(flowShift);
    return params;
  }

  static _addOptional(body, { negativePrompt, moeBoundary, loras, cacheMode, cacheOption }) {
    if (negativePrompt) body.negative_prompt = negativePrompt;
    if (Number(moeBoundary) > 0 && Number(moeBoundary) <= 1) body.moe_boundary = Number(moeBoundary);
    if (Array.isArray(loras) && loras.length) body.lora = loras;
    if (cacheMode) {
      body.cache_mode = String(cacheMode);
      if (cacheOption) body.cache_option = String(cacheOption);
    }
  }

  static _addHighNoise(body, { highNoiseSteps, highNoiseCfgScale, highNoiseSampler }) {
    const hn = {};
    if (Number(highNoiseSteps) > 0) hn.sample_steps = Math.floor(Number(highNoiseSteps));
    if (typeof highNoiseCfgScale === 'number' && Number.isFinite(highNoiseCfgScale)) hn.guidance = { txt_cfg: highNoiseCfgScale };
    if (highNoiseSampler) hn.sample_method = String(highNoiseSampler);
    if (Object.keys(hn).length) body.high_noise_sample_params = hn;
  }

  static _addFrames(body, { firstFrame, lastFrame }) {
    if (firstFrame) body.init_image = ImageBytes.toBase64(firstFrame);
    if (lastFrame) body.end_image = ImageBytes.toBase64(lastFrame);
  }
}

module.exports = SdcppVideoBody;
