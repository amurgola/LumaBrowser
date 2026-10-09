# HfHubClient

`core/llm-server/models/HfHubClient.js`

HTTP transport for the HuggingFace Hub: authenticated GETs, repo file reads,
repo id checks and download URLs. Pure axios, no Electron.

## Methods

- `HfHubClient.get(url, { signal, timeout })` returns the response body.
  401/403/404 throw an error with `code: 'HF_NOT_FOUND'` ("Not found on
  HuggingFace." or "This model is private or gated. Set HF_TOKEN, or pick
  another."); other HTTP errors throw from axios as usual.
- `HfHubClient.getRepoFile(repoId, file, { signal, accept, ...axiosOptions })`
  reads `resolve/main/<file>`; returns `null` for any non-200 or network error,
  never `null` for a readable file (an empty body is `''`).
- `HfHubClient.resolveUrl(repoId, repoPath)` is the public download URL
  (`...?download=true`, path URI-encoded).
- `HfHubClient.fileUrl(repoId, file)`, `HfHubClient.treeUrl(repoId)`.
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

Public repos need no auth. `HF_TOKEN` (or `HUGGING_FACE_HUB_TOKEN`) is
forwarded as a bearer token when set, for higher rate limits and gated repos.
