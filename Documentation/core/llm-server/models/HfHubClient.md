# HfHubClient

`core/llm-server/models/HfHubClient.js`

HTTP transport for the HuggingFace Hub: authenticated GETs, repo file reads,
repo id checks, revision resolution and download URLs. Pure axios, no Electron.

## Methods

- `HfHubClient.get(url, { signal, timeout, attempts = 1 })` returns the response
  body. 404 throws `code: 'HF_NOT_FOUND'` ("Not found on HuggingFace.");
  401/403 throw the `HF_ACCESS_DENIED` [DownloadError](../../shared/download/DownloadError.md)
  whose message says the repo is gated or private and whether `HF_TOKEN` is
  missing or lacks access; other HTTP errors throw from axios as usual.
  `attempts > 1` backs off through [DownloadRetry](../../shared/download/DownloadRetry.md)
  on 429/503 (Retry-After honoured, 5 s cap) and network errors, never on
  401/403/404.
- `HfHubClient.resolveRevision(repoId, revision = 'main', { signal })` asks
  `/api/models/<repo>/revision/<rev>` (3 attempts) and resolves
  `{ requested, sha, pinned: true }`. When the Hub cannot be asked for a reason
  other than access (offline, 5xx, no sha in the answer) it resolves
  `{ requested, sha: requested, pinned: false, fallbackReason }`; an access
  refusal throws.
- `HfHubClient.getRepoFile(repoId, file, { signal, accept, revision, ...axiosOptions })`
  reads `resolve/<revision>/<file>` (default main); returns `null` for any
  non-200 or network error, never `null` for a readable file (an empty body is `''`).
- `HfHubClient.resolveUrl(repoId, repoPath, revision = 'main')` is the public
  download URL (`...?download=true`, path URI-encoded, revision encoded as one
  segment).
- `HfHubClient.fileUrl(repoId, file, revision = 'main')`,
  `HfHubClient.treeUrl(repoId, revision = 'main')`,
  `HfHubClient.revisionUrl(repoId, revision)`.
- `HfHubClient.authHeaders()` the User-Agent, Accept and (when set) bearer
  token headers; `HfHubClient.isAccessError(err)`; `HfHubClient.DEFAULT_REVISION`.
- `HfHubClient.normalizeRepoId(raw)` trims whitespace and edge slashes;
  `HfHubClient.isRepoId(id)` checks `owner/repo`;
  `HfHubClient.requireRepoId(raw)` returns the normalized id or throws
  `code: 'HF_BAD_ID'`.
- `HfHubClient.splitRepoId(id)` returns `{ author, name }`.
- `HfHubClient.notFound(message)` builds an `HF_NOT_FOUND` error.
- `HfHubClient.BASE` is `https://huggingface.co`.

## Why

The Hub describes a GGUF model without downloading a byte: search
(`/api/models?filter=gguf`), parsed header (`/api/models/{repo}?expand[]=gguf`)
and exact per-file sizes (`/api/models/{repo}/tree/main?recursive=true`). So
catalog sizes, params and context become derived data.

Public repos need no auth. The token read by
[HubAuth](../../shared/download/HubAuth.md) (`HF_TOKEN`, else
`HUGGING_FACE_HUB_TOKEN`) is forwarded as a bearer token when set, for higher
rate limits and gated repos; the same source puts it on every file transfer.

Revision resolution exists so one pull can build every file URL from a commit
sha ([HfPinnedRepo](HfPinnedRepo.md)) instead of `main`, which can move
between two files of a sharded download.
