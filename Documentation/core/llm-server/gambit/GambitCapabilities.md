# GambitCapabilities

`core/llm-server/gambit/GambitCapabilities.js`

Works out which capabilities this host can offer the gambit right now, so
[GambitRunner](GambitRunner.md) skips a task whose capability is missing
instead of failing it.

## Methods

- `GambitCapabilities.detect({ checkWeb = true, probe?, imageRouter? })`
  resolves `{ caps: { web, images }, reasons }`.
  - `web` is probed once (unless `checkWeb` is false, which assumes it);
    unreachable gives `reasons.web = 'automation-test page unreachable (<detail>)'`.
  - `images` is true when an image router is present (default
    `global.__lumaImageRouter`), else `reasons.images = 'no image server on this build'`.
- `GambitCapabilities.probeWeb(url = WEB_TARGET, timeoutMs = 8000, client = https)`
  resolves `{ ok, detail }` and never rejects: `ok` for HTTP 2xx and 3xx,
  `detail` is `HTTP <status>`, `no response in <ms>ms`, or the error message.
- `WEB_TARGET` (`https://lumabyte.com/automation-test`), `PROBE_TIMEOUT_MS`.

## Why

An offline laptop would otherwise score every model around 30 percent and the
number would look like a model problem. Probing once up front and skipping
with a reason keeps the grade about the model.
