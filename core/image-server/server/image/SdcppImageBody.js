const ImageBytes = require('./ImageBytes');
const RefImageClamp = require('./RefImageClamp');

class SdcppImageBody {
  static DEFAULT_SIZE = 512;
  static DEFAULT_STEPS = 20;
  static DEFAULT_SAMPLER = 'euler';
  static DEFAULT_CFG = 7.0;
  static DEFAULT_STRENGTH = 0.75;

  static build(request) {
    const body = SdcppImageBody._base(request);
    SdcppImageBody._addOptional(body, request);
    SdcppImageBody._addCustomSigmas(body, request.customSigmas);
    SdcppImageBody._addInitImage(body, request);
    SdcppImageBody._addRefImages(body, request);
    return body;
  }

  static _base({ prompt, width, height, seed, outputFormat, steps, sampler, scheduler, cfgScale }) {
    return {
      prompt,
      width: width || SdcppImageBody.DEFAULT_SIZE,
      height: height || SdcppImageBody.DEFAULT_SIZE,
      seed: typeof seed === 'number' && seed >= 0 ? seed : -1,
      batch_count: 1,
      output_format: outputFormat || 'png',
      sample_params: {
        sample_steps: steps || SdcppImageBody.DEFAULT_STEPS,
        sample_method: sampler || SdcppImageBody.DEFAULT_SAMPLER,
        ...(scheduler ? { scheduler } : {}),
        guidance: { txt_cfg: typeof cfgScale === 'number' ? cfgScale : SdcppImageBody.DEFAULT_CFG },
      },
    };
  }

  static _addOptional(body, { negativePrompt, loras, refImageArgs, cacheMode, cacheOption }) {
    if (negativePrompt) body.negative_prompt = negativePrompt;
    if (Array.isArray(loras) && loras.length) body.lora = loras;
    if (refImageArgs) body.ref_image_args = String(refImageArgs);
    if (cacheMode) {
      body.cache_mode = String(cacheMode);
      if (cacheOption) body.cache_option = String(cacheOption);
    }
  }

  static _addCustomSigmas(body, customSigmas) {
    if (!Array.isArray(customSigmas) || customSigmas.length <= 1) return;
    body.sample_params.custom_sigmas = customSigmas;
    body.sample_params.sample_steps = customSigmas.length - 1;
  }

  static _addInitImage(body, { initImage, strength, mask }) {
    if (!initImage) return;
    body.init_image = ImageBytes.toBase64(initImage);
    const s = Number(strength);
    body.strength = Number.isFinite(s) && s >= 0 && s <= 1 ? s : SdcppImageBody.DEFAULT_STRENGTH;
    if (mask) body.mask_image = RefImageClamp.clamp(ImageBytes.toBase64(mask));
  }

  static _addRefImages(body, { refImages, width, height }) {
    if (!Array.isArray(refImages) || !refImages.length) return;
    const bound = RefImageClamp.boundFor(width, height);
    body.ref_images = refImages.filter(Boolean).map((ref) => RefImageClamp.clamp(ImageBytes.toBase64(ref), bound));
  }
}

module.exports = SdcppImageBody;
