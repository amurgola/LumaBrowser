class LabStepParams {
  static SCALARS = [
    'modelRef', 'slot', 'prompt', 'negativePrompt', 'width', 'height',
    'steps', 'cfgScale', 'sampler', 'scheduler', 'strength', 'seed',
  ];

  static RESOLVED = ['width', 'height', 'steps', 'cfgScale', 'sampler', 'scheduler', 'seed', 'strength'];

  static scrub(opts) {
    const out = {};
    for (const k of LabStepParams.SCALARS) if (opts[k] !== undefined) out[k] = opts[k];
    if (opts.initImage) out.initImage = `<${LabStepParams._base64Bytes(opts.initImage)} bytes>`;
    if (opts.mask) out.mask = `<mask ${LabStepParams._base64Bytes(opts.mask)} bytes>`;
    if (Array.isArray(opts.refImages)) out.refImages = `${opts.refImages.filter(Boolean).length} ref image(s)`;
    return out;
  }

  static overlayResolved(params, effective) {
    if (!effective || typeof effective !== 'object') return params;
    for (const k of LabStepParams.RESOLVED) {
      if (effective[k] !== undefined && effective[k] !== null) params[k] = effective[k];
    }
    return params;
  }

  static _base64Bytes(s) {
    return Math.round((String(s).length * 3) / 4);
  }
}

module.exports = LabStepParams;
