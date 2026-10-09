const ImageAdapter = require('./ImageAdapter');
const SdcppJob = require('./SdcppJob');
const SdcppPayload = require('./SdcppPayload');
const SdcppImageBody = require('./SdcppImageBody');
const SdcppResult = require('./SdcppResult');

class SdCppHttpAdapter extends ImageAdapter {
  static SUBMIT_PATH = '/sdcpp/v1/img_gen';
  static DEFAULT_REQUEST_MS = 20 * 60 * 1000;
  static DEFAULT_POLL_RETRIES = 3;
  static CADENCE = { pollFirstMs: 500, pollEveryMs: 750, backoffBaseMs: 750 };

  static get protocolId() {
    return 'sd-cpp-http';
  }

  async healthCheck() {
    return SdcppJob.healthCheck(this.baseUrl, this._authHeaders());
  }

  generate(request) {
    this._requirePrompt(request.prompt);
    return SdcppJob.run({
      baseUrl: this.baseUrl,
      headers: this._authHeaders(),
      submitPath: SdCppHttpAdapter.SUBMIT_PATH,
      body: SdcppImageBody.build(request),
      noun: 'image',
      extract: SdCppHttpAdapter._extract,
      emptyMessage: () => 'sd-server returned completed with no images.',
      ...SdCppHttpAdapter._budgets(),
      ...SdCppHttpAdapter.CADENCE,
      onProgress: request.onProgress,
      onPreview: request.onPreview,
      onDone: request.onDone,
      onError: request.onError,
    });
  }

  static _budgets() {
    return {
      maxRequestMs: SdcppPayload.positiveInt(process.env.SD_IMAGE_REQUEST_TIMEOUT_MS, SdCppHttpAdapter.DEFAULT_REQUEST_MS),
      maxPollFailures: SdcppPayload.positiveInt(process.env.SD_IMAGE_POLL_RETRIES, SdCppHttpAdapter.DEFAULT_POLL_RETRIES),
    };
  }

  static _extract(data) {
    const images = SdcppResult.images(data);
    return images.length ? { images, raw: data } : null;
  }
}

module.exports = SdCppHttpAdapter;
