# SdcppJob

`core/image-server/server/image/SdcppJob.js`

The sd-server async job lifecycle shared by the image (`img_gen`) and video
(`vid_gen`) adapters: submit, poll `GET /sdcpp/v1/jobs/{id}` until `completed`
or `failed`, with the resilience guards.

## Methods

- `SdcppJob.run(options)` starts a job and returns `{ abort }`. Options:
  `baseUrl`, `headers`, `submitPath`, `body`, `noun` ('image' | 'video'),
  `extract(data)` (returns the onDone payload or null), `emptyMessage(data)`,
  `maxRequestMs`, `maxPollFailures`, `pollFirstMs`, `pollEveryMs`,
  `backoffBaseMs`, and callbacks `onProgress`, `onPreview`, `onDone`, `onError`.
- `SdcppJob.healthCheck(baseUrl, headers)` resolves true for any HTTP answer from
  the jobs index (1.5 s timeout), false on a network error.
- Statics: `JOBS_PATH`, `HEALTH_TIMEOUT_MS`, `CANCEL_TIMEOUT_MS`,
  `POLL_TIMEOUT_MS`, `MAX_SUBMIT_MS` (120 s), `MAX_BACKOFF_MS` (5 s).

## Lifecycle

- Submit: a non-2xx or a response without `id` / `result.id` fails. The submit
  timeout is `min(maxRequestMs, 120 s)` because it only enqueues; an unbounded
  wait is how a wedged server hangs the call.
- Poll: first after `pollFirstMs`, then every `pollEveryMs`. Progress and
  previews are forwarded (`SdcppPayload`). `completed` runs `extract`; an empty
  extract fails with `emptyMessage`. `failed` or any `error` fails with a readable
  message. A non-2xx poll fails at once.
- Transient poll errors back off `min(5 s, backoffBaseMs * 2^failures)` and fail
  with `polling failed N times` past `maxPollFailures`.
- The wall-clock deadline (`maxRequestMs`) is checked before each poll.
- Any failure, and `abort()`, deletes the server job once (best effort, 1.5 s).
  Callbacks never fire after `abort()`. Throwing callbacks are swallowed.

## Why

One copy stops the two adapters drifting again: the video path once shipped with
none of the guards (bug H1, a dead sd-server left its poll loop retrying forever)
because the contract had been written against the image copy only. A local
timeout or exhausted retries says nothing about the server's job, so it is
deleted explicitly; otherwise it keeps burning the card with no consumer, or
blocks the user's retry behind an orphaned generation.

Deliberately not here: the request body (very different per medium), `extract`
(the video one closes over request state), and the env reads for the budgets
(image and video use separate env names on purpose, since a clip can run for an
hour), so `run` takes resolved numbers.
