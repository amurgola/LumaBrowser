# DownloadError

`core/shared/download/DownloadError.js`

The typed failures a download can end in, so retry loops know what is worth
another attempt and the UI can say why a transfer stopped.

## Shape

Every `DownloadError` extends `Error` with `code`, `status` (HTTP, or null),
`retryable` and `retryAfterMs` (from a Retry-After header, or null). Codes:

- `HF_ACCESS_DENIED` 401/403 on a Hub host: the repo is gated or private. The
  message says whether no `HF_TOKEN` is set or the set one lacks access.
- `DOWNLOAD_NOT_FOUND` 404.
- `DOWNLOAD_INTEGRITY` size or sha256 mismatch; never retried.
- `DOWNLOAD_NO_SPACE` the free-space guard refused.
- `DOWNLOAD_UNSAFE_PATH` a repo-supplied path was refused.
- `DOWNLOAD_HTTP` any other status (retryable for 408, 429 and 5xx).
- `DOWNLOAD_NETWORK` no response at all; retryable.

## Methods

- `DownloadError.fromStatus(status, { url, forLabel, headers })` maps a status
  as above; `url` decides whether 401/403 is the Hub access error.
- `DownloadError.fromRequest(err, { url, forLabel })` normalises an axios or
  plain error (typed errors pass through unchanged).
- `DownloadError.retryAfterMs(headers)` reads delay-seconds or an HTTP date.
- `DownloadError.integrity(message)`, `.noSpace(message)`, `.unsafePath(message)`.
- `DownloadError.is(err, code?)`.

## Why

A corrupt file, a missing token and a dropped socket used to all surface as the
same string, and the chunk retry loop treated them alike. Typing the failure is
what lets [DownloadRetry](DownloadRetry.md) stop at once on auth, 404 and
integrity, and lets the model setup UI show "this repo is gated; set HF_TOKEN"
instead of "Download request failed".
