const ImageAdapter = require('./ImageAdapter');
const SdcppJob = require('./SdcppJob');
const SdcppPayload = require('./SdcppPayload');
const SdcppVideoBody = require('./SdcppVideoBody');
const SdcppResult = require('./SdcppResult');

class SdCppVideoAdapter extends ImageAdapter {
  static SUBMIT_PATH = '/sdcpp/v1/vid_gen';
  static DEFAULT_REQUEST_MS = 60 * 60 * 1000;
  static DEFAULT_POLL_RETRIES = 5;
  static CADENCE = { pollFirstMs: 750, pollEveryMs: 1000, backoffBaseMs: 1500 };

  static get protocolId() {
    return 'sd-cpp-video';
  }

  async healthCheck() {
    return SdcppJob.healthCheck(this.baseUrl, this._authHeaders());
  }

  generate(request) {
    this._requirePrompt(request.prompt);
    const body = SdcppVideoBody.build(request);
    return SdcppJob.run({
      baseUrl: this.baseUrl,
      headers: this._authHeaders(),
      submitPath: SdCppVideoAdapter.SUBMIT_PATH,
      body,
      noun: 'video',
      extract: (data) => SdCppVideoAdapter._extract(data, body),
      emptyMessage: (data) => `sd-server returned completed with no video data. result keys: ${SdcppResult.resultKeys(data)}`,
      ...SdCppVideoAdapter._budgets(),
      ...SdCppVideoAdapter.CADENCE,
      onProgress: request.onProgress,
      onPreview: request.onPreview,
      onDone: request.onDone,
      onError: request.onError,
    });
  }

  static _budgets() {
    return {
      maxRequestMs: SdcppPayload.positiveInt(process.env.SD_VIDEO_REQUEST_TIMEOUT_MS, SdCppVideoAdapter.DEFAULT_REQUEST_MS),
      maxPollFailures: SdcppPayload.positiveInt(process.env.SD_VIDEO_POLL_RETRIES, SdCppVideoAdapter.DEFAULT_POLL_RETRIES),
    };
  }

  static _extract(data, body) {
    const video = SdcppResult.video(data);
    if (!video || !video.bytes || !video.bytes.length) return null;
    return {
      video: {
        bytes: video.bytes,
        mime: video.mime,
        encoder: 'sd-server',
        frameCount: video.frameCount || body.video_frames,
        fps: video.fps || body.fps,
        width: body.width,
        height: body.height,
        outputFormat: video.outputFormat || body.output_format,
      },
      raw: { status: data.status, result: SdcppResult.redact(data.result) },
    };
  }
}

module.exports = SdCppVideoAdapter;
