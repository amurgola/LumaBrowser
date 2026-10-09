# DownloadHeaders

`core/shared/download/DownloadHeaders.js`

Reads the total file size and the trustworthy published sha256 from HTTP
response headers.

## Methods

- `DownloadHeaders.totalFromHeaders(headers, offset)` returns the total from
  `Content-Range: bytes a-b/TOTAL`, else `offset + Content-Length`, else 0.
- `DownloadHeaders.sha256FromHeaders(headers)` returns the lowercase hex digest
  from `X-Linked-Etag` when it is exactly 64 hex characters (optionally
  quoted), else `null`.

## Why

Only Hugging Face's `X-Linked-Etag` (the LFS object digest) is trusted. A plain
`ETag` is often an MD5 or an S3 multipart composite, and treating it as sha256
would "verify" against the wrong digest. `null` means size-only verification.
