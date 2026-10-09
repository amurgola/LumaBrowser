# SdCppHttpAdapter

`core/image-server/server/image/SdCppHttpAdapter.js`

[ImageAdapter](ImageAdapter.md) for stable-diffusion.cpp's sd-server image API
(`protocolId: 'sd-cpp-http'`): `POST /sdcpp/v1/img_gen`, then polling
`GET /sdcpp/v1/jobs/{id}` through [SdcppJob](SdcppJob.md).

## Methods

- `healthCheck()` is `SdcppJob.healthCheck` with the auth headers.
- `generate(request)` throws `generate: prompt is required` without a string
  prompt, builds the body with [SdcppImageBody](SdcppImageBody.md) and returns
  SdcppJob's `{ abort }`. Extra request fields: `outputFormat`, `loras`,
  `initImage`, `strength`, `mask`, `refImages`, `customSigmas`, `refImageArgs`,
  `cacheMode`, `cacheOption`. `onDone` receives `{ images, raw }` (decoded by
  [SdcppResult](SdcppResult.md)); a completed job without images fails with
  `sd-server returned completed with no images.`
- Statics: `SUBMIT_PATH`, `DEFAULT_REQUEST_MS` (20 min), `DEFAULT_POLL_RETRIES`
  (3), `CADENCE` (first poll 500 ms, then every 750 ms, backoff base 750 ms).

## Why

Budgets come from `SD_IMAGE_REQUEST_TIMEOUT_MS` and `SD_IMAGE_POLL_RETRIES`,
separate from the video names, so tuning one path cannot truncate the other.
The round trip is local and small, so the cadence is brisk. Progress is best
effort: sd-server does not stream steps, but the job payload often carries a counter.
