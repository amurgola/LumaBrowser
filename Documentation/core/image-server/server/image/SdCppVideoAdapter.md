# SdCppVideoAdapter

`core/image-server/server/image/SdCppVideoAdapter.js`

[ImageAdapter](ImageAdapter.md) for sd-server's video API
(`protocolId: 'sd-cpp-video'`): `POST /sdcpp/v1/vid_gen`, polled through
[SdcppJob](SdcppJob.md). The server encodes the container itself, so a
completed job carries one base64 file, not frames.

## Methods

- `healthCheck()` is `SdcppJob.healthCheck` with the auth headers.
- `generate(request)` requires a string prompt, builds the body with
  [SdcppVideoBody](SdcppVideoBody.md) and returns `{ abort }`. `onDone`
  receives `{ video: { bytes, mime, encoder: 'sd-server', frameCount, fps,
  width, height, outputFormat }, raw: { status, result (redacted) } }`.
  Frame count, fps and format fall back to the requested values when the
  server omits them; width and height are always the requested ones. An empty
  result fails with `sd-server returned completed with no video data. result keys: <keys>`.
- Statics: `SUBMIT_PATH`, `DEFAULT_REQUEST_MS` (60 min), `DEFAULT_POLL_RETRIES`
  (5), `CADENCE` (first poll 750 ms, then every 1 s, backoff base 1.5 s).

## Why

A clip legitimately runs for many minutes, so the budgets are video-sized and
use their own env names (`SD_VIDEO_REQUEST_TIMEOUT_MS`, `SD_VIDEO_POLL_RETRIES`).
The extractor closes over the request body because the requested values only
exist per call.
