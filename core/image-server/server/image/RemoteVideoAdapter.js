const RemoteImageAdapter = require('./RemoteImageAdapter');
const ImageBytes = require('./ImageBytes');

class RemoteVideoAdapter extends RemoteImageAdapter {
  static ROLE = 'image-video';
  static SLOT = 'video';
  static NOUN = 'remote video server';

  static get protocolId() {
    return 'luma-sharing-video';
  }

  constructor({ baseUrl, token } = {}) {
    super({ baseUrl, token });
    this.role = RemoteVideoAdapter.ROLE;
  }

  _body({ model, prompt, negativePrompt, width, height, steps, cfgScale, seed, sampler, scheduler, videoFrames, durationSec, fps, flowShift, firstFrame, lastFrame }) {
    return {
      model: model || null,
      prompt,
      negativePrompt,
      width,
      height,
      steps,
      cfgScale,
      seed,
      sampler,
      scheduler,
      videoFrames,
      durationSec,
      fps,
      flowShift,
      firstFrame: ImageBytes.toBase64(firstFrame),
      lastFrame: ImageBytes.toBase64(lastFrame),
    };
  }

  _slot() {
    return RemoteVideoAdapter.SLOT;
  }

  _streamNoun() {
    return RemoteVideoAdapter.NOUN;
  }

  _requestUrl() {
    return `${this.baseUrl}/generate`;
  }

  _infoUrl() {
    return `${this.baseUrl.replace(/\/video$/, '')}/info`;
  }
}

module.exports = RemoteVideoAdapter;
