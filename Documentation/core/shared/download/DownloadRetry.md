# DownloadRetry

`core/shared/download/DownloadRetry.js`

The retry policy every transfer step shares.

## Methods

- `DownloadRetry.run(fn, { attempts = 4, isStopped, maxDelayMs = 30 s, sleep,
  random, onRetry })` calls `fn(attempt)` until it resolves. A failure that
  `shouldRetry` rejects, a stop (`isStopped()` true) or the last attempt rethrows
  at once; otherwise it waits `delayFor(attempt, err)` and tries again.
  `sleep` and `random` are test seams; `onRetry({ attempt, delayMs, error })`
  is advisory.
- `DownloadRetry.shouldRetry(err)` true for network errors and 408/429/5xx;
  false for a `DownloadError` with `retryable: false` (auth, 404, integrity,
  no space, unsafe path), an abort, or any other 4xx.
- `DownloadRetry.delayFor(attempt, err, { maxDelayMs, random })` a Retry-After
  (from `err.retryAfterMs` or the response headers) wins, capped at
  `RETRY_AFTER_CAP_MS` (60 s); otherwise `BASE_DELAY_MS` (500 ms) doubling per
  attempt with 25% jitter, capped at `maxDelayMs`.
- `DownloadRetry.sleep(ms)`.

## Where it runs

- [ResumableDownload](ResumableDownload.md): the probe.
- [ParallelDownload](ParallelDownload.md): each chunk (`CHUNK_ATTEMPTS`, 4).
- [SequentialDownload](SequentialDownload.md): the whole request-and-stream
  cycle, so a dropped connection resumes from the new offset after a backoff.
- [HfHubClient](../../llm-server/models/HfHubClient.md)`.get` when asked
  (`attempts > 1`, used for revision resolution and pinned tree reads).

## Why

Chunks used to retry three times with no pause, and the probe and sequential
paths not at all. A 429 from the Hub or a 503 from the CDN now waits what the
server asked for, and a failure another attempt cannot fix is never hammered.
