# CivitaiClient

`core/image-server/civitai/CivitaiClient.js`

HTTP client for the CivitAI public REST API (`https://civitai.com/api/v1`, documented at developer.civitai.com): model listing and search, single model and version reads, hash lookup, sample images with their generation metadata, and the enum vocabularies.

## Methods

- `new CivitaiClient({ get?, attempts?, timeout? })`; `get` defaults to `axios.get` (the test seam), `attempts` to 3 (backs off on 429/5xx and network errors through [DownloadRetry](../../shared/download/DownloadRetry.md), never on a 4xx), `timeout` to 20 s. Every method takes an optional trailing `{ signal }`.
- `listModels(filters)` resolves `{ items, nextCursor, nextPage, currentPage?, pageSize? }`. Filters: `query`, `types`, `baseModels` (string or array; arrays go out as repeated params), `tag`, `username`, `ids`, `checkpointType`, `sort` (`SORTS`), `period` (`PERIODS`), `nsfw` (sent as `false` unless given), `supportsGeneration`, `earlyAccess`, `primaryFileOnly`, `favorites`, `hidden`, `limit` (capped at 100), `page`, `cursor`. A `query` drops `page`, since the API refuses the pair.
- `getModel(id)`, `getVersion(id)`, `getVersionMini(id)` (the trimmed read with `requireAuth`, `downloadUrls`, `air`), `enums()` (`ModelType`, `BaseModel`, ...). A non-positive id throws `CIVITAI_BAD_REQUEST`.
- `getVersionByHash(hash)` any of AutoV1/AutoV2/AutoV3/SHA256/BLAKE3/CRC32, upper-cased; a miss answers `null` (a file CivitAI never saw is normal).
- `listImages(filters)` resolves `{ items, nextCursor }`; `withMeta` defaults to `true` so each item that has one carries `meta` (`steps`, `sampler`, `cfgScale`, `clipSkip`, `prompt`, `negativePrompt`, `width`, `height`, `Schedule type`, ...). Filters: `modelId`, `modelVersionId`, `postId`, `username`, `sort` (`IMAGE_SORTS`), `period`, `nsfw` or `browsingLevel`, `type`, `limit` (capped at 200), `cursor`.
- `CivitaiClient.downloadUrl(versionId, { fileId?, type?, format?, size?, fp? })` the `/api/download/models/<id>` URL, optionally pinned to one file or variant.
- `CivitaiClient.primaryFile(version)` the file flagged `primary`, else the first `Model` file, else the first file, else `null`.
- `CivitaiClient.buildUrl(base, params)` repeated params for arrays, `null` / `undefined` / `''` skipped, booleans literal.
- `CivitaiClient.headers()` `User-Agent`, `Accept: application/json` and the bearer header from [CivitaiAuth](../../shared/download/CivitaiAuth.md) when a key is set.

## Errors

Every failure is an `Error` with a `code` (and `status`, `url` where known): `CIVITAI_AUTH` for 401/403 (the message says whether a key is missing or was refused), `CIVITAI_NOT_FOUND` for 404 with the server's text (`Not found on CivitAI: No model with id 7`), `CIVITAI_BAD_REQUEST` for 400 (a Zod error object is reported as `invalid parameters`), `CIVITAI_HTTP` for other statuses, `CIVITAI_NETWORK` without a response. Aborts pass through untouched.

## Why

- Repeated params, not comma lists: `types=LORA,LoCon` is a 400 and `baseModels=Illustrious,Pony` an empty page (verified 2026-11-04), while the repeated form filters correctly.
- `nsfw` is sent explicitly because the API's default is `false`; the caller decides from the user's setting.
- The axios error is left intact through the retry loop (its `response.status` is what `DownloadRetry.shouldRetry` reads) and only translated afterwards.
- Public endpoints are cached upstream for 300 s, so listing is cheap; there is no published per-endpoint rate limit, only Cloudflare's edge limits, hence the modest default attempts.
