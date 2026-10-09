const axios = require('axios');
const ImageAdapter = require('./ImageAdapter');
const ImageBytes = require('./ImageBytes');
const RemoteImageStream = require('./RemoteImageStream');
const PinnedTls = require('../../../network-sharing/tls/PinnedTls');

class RemoteImageAdapter extends ImageAdapter {
  static HEALTH_TIMEOUT_MS = 3000;

  static get protocolId() {
    return 'luma-sharing-image';
  }

  constructor({ baseUrl, token, role } = {}) {
    super({ baseUrl, apiKey: token });
    this.token = this.apiKey;
    this.role = role === 'image-edit' ? 'image-edit' : 'image-generate';
  }

  async healthCheck() {
    try {
      const res = await axios.get(this._infoUrl(), { timeout: RemoteImageAdapter.HEALTH_TIMEOUT_MS, validateStatus: () => true, ...this._agentOption() });
      return res.status >= 200 && res.status < 300;
    } catch (_) {
      return false;
    }
  }

  generate(request) {
    const stream = new RemoteImageStream(request);
    const controller = new AbortController();
    this._post(request, controller)
      .then((res) => stream.onResponse(res))
      .catch((err) => {
        if (!stream.isAborted()) stream.fail((err && err.message) || 'remote image request failed');
      });
    return { abort: () => RemoteImageAdapter._abort(stream, controller) };
  }

  _post(request, controller) {
    return axios.post(this._requestUrl(), this._body(request), {
      headers: this._headers(),
      responseType: 'stream',
      signal: controller.signal,
      timeout: 0,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      validateStatus: () => true,
      ...this._agentOption(),
    });
  }

  _body({ model, prompt, negativePrompt, width, height, steps, cfgScale, seed, sampler, scheduler, initImage, strength, refImages, mask }) {
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
      strength,
      initImage: ImageBytes.toBase64(initImage),
      mask: ImageBytes.toBase64(mask),
      refImages: Array.isArray(refImages) ? refImages.filter(Boolean).map(ImageBytes.toBase64) : null,
      slot: this._slot(),
    };
  }

  _headers() {
    return { 'Content-Type': 'application/json', Accept: 'application/x-ndjson', ...this._authHeaders() };
  }

  _agentOption() {
    let httpsAgent = null;
    try {
      httpsAgent = PinnedTls.agentFor(this.baseUrl);
    } catch (_) {}
    return httpsAgent ? { httpsAgent } : {};
  }

  _slot() {
    return this.role === 'image-edit' ? 'edit' : 'generate';
  }

  _requestUrl() {
    return `${this.baseUrl}/${this._slot()}`;
  }

  _infoUrl() {
    return `${this.baseUrl.replace(/\/image$/, '')}/info`;
  }

  static _abort(stream, controller) {
    if (stream.isAborted()) return;
    stream.abort();
    try {
      controller.abort();
    } catch (_) {}
  }
}

module.exports = RemoteImageAdapter;
