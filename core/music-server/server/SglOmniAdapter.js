const axios = require('axios');

class SglOmniAdapter {
  static REQUEST_TIMEOUT_MS = 30 * 60 * 1000;
  static MAX_RESPONSE_BYTES = 512 * 1024 * 1024;
  static MAX_REQUEST_BYTES = 16 * 1024 * 1024;
  static MIN_AUDIO_BYTES = 64;
  static SAMPLE_RATE = 32000;
  static DETAIL_MAX = 500;

  static generate({ baseUrl, model, lyrics, instructions, seed, maxNewTokens }) {
    const controller = new AbortController();
    const body = SglOmniAdapter._requestBody({ model, lyrics, instructions, seed, maxNewTokens });
    const promise = SglOmniAdapter._run(baseUrl, body, controller);
    const abort = () => {
      try {
        controller.abort();
      } catch (_) {}
    };
    return { promise, abort };
  }

  static _requestBody({ model, lyrics, instructions, seed, maxNewTokens }) {
    const body = { model, input: lyrics, instructions, response_format: 'wav', stream: false };
    if (Number.isFinite(seed)) body.seed = Math.trunc(seed);
    if (Number.isFinite(maxNewTokens)) body.max_new_tokens = Math.trunc(maxNewTokens);
    return body;
  }

  static async _run(baseUrl, body, controller) {
    const response = await SglOmniAdapter._post(baseUrl, body, controller);
    if (response.status !== 200) throw new Error(`Music server returned ${response.status}: ${SglOmniAdapter._detail(response.data) || 'no detail'}`);
    const bytes = Buffer.from(response.data);
    if (bytes.length < SglOmniAdapter.MIN_AUDIO_BYTES) throw new Error('Music server returned an empty audio body.');
    return { audio: { bytes, mime: 'audio/wav', sampleRate: SglOmniAdapter.SAMPLE_RATE } };
  }

  static async _post(baseUrl, body, controller) {
    try {
      return await axios.post(`${baseUrl}/v1/audio/speech`, body, {
        responseType: 'arraybuffer',
        timeout: SglOmniAdapter.REQUEST_TIMEOUT_MS,
        signal: controller.signal,
        maxContentLength: SglOmniAdapter.MAX_RESPONSE_BYTES,
        maxBodyLength: SglOmniAdapter.MAX_REQUEST_BYTES,
        validateStatus: () => true,
      });
    } catch (err) {
      throw SglOmniAdapter._requestError(err, controller);
    }
  }

  static _requestError(err, controller) {
    if (!controller.signal.aborted) return new Error(`Music server request failed: ${err.message}`);
    const aborted = new Error('Music generation aborted.');
    aborted.code = 'ABORTED';
    return aborted;
  }

  static _detail(data) {
    try {
      return Buffer.from(data).toString('utf8').slice(0, SglOmniAdapter.DETAIL_MAX);
    } catch (_) {
      return '';
    }
  }
}

module.exports = SglOmniAdapter;
