# RuntimeUpdateChecker

`core/shared/runtime/RuntimeUpdateChecker.js`

Decides, per installed managed runtime, whether a newer upstream release
exists. Used by the LLM and image server IPC handlers to show "Update" versus
"Reinstall" on the Setup tab.

## Methods

- `RuntimeUpdateChecker.check(options)` is the one-call entry point; it builds
  an instance and runs `execute()`.
- `new RuntimeUpdateChecker(options).execute()` resolves
  `{ [runtimeId]: { current, latest, updateAvailable, error } }`.
- `RuntimeUpdateChecker.DEFAULT_TTL_MS` (5 minutes) is the default cache TTL.

Options:

- `view` the runtimes view (`{ runtimes: [...] }`); missing or empty is fine.
- `kind` the caller's inference kind (`'inference'`, `'image-inference'`, ...).
- `fetchLatestRelease(repo)` resolves `{ tag_name }` for `{ owner, repo }`.
- `fetchLatestPrerelease(repo)` optional; used for runtimes whose manifest
  records `release.channel === 'prerelease'`.
- `cache` a caller-owned `Map`, so the TTL survives across calls.
- `ttlMs` cache TTL, default `DEFAULT_TTL_MS`.
- `now` injectable clock, default `Date.now()`.

## Eligibility

A runtime is skipped when any of these hold:

- `kind` differs from the caller's (format-only entries have no binary)
- not `installed` (nothing to compare)
- `acquisition !== 'github-release'` (no release feed to read)
- `source !== 'managed'` (PATH and user-registered binaries are the user's to
  version)
- no `manifest.release.tag` (installed before the tag was recorded; unknown, so
  the UI falls back to Reinstall)
- no complete `repo.owner` / `repo.repo`

## Why

- **Grouped by repo and channel.** Three llama.cpp flavours from one repo make
  one API call, not three.
- **Cached per repo with a TTL**, so flipping between settings tabs does not
  re-hammer GitHub. Failures are cached too, so a rate limit is not retried in
  a tight loop. An entry is fresh while `now - at <= ttlMs`.
- **Failures are isolated per repo.** One repo's network error is reported
  against its own runtimes (`latest: null, updateAvailable: false, error`) and
  does not fail the whole check.
- **Channel is part of the cache key.** An opted-in nightly compared against the
  stable feed would read as "behind" forever. Stable keeps the bare
  `owner/repo` key, pre-release uses `owner/repo#prerelease`, so caches from
  before channels existed stay valid. Without a pre-release fetcher, the stable
  feed is used for everything.
- **Plain tag inequality** decides `updateAvailable`. Enough for the shipped
  catalogs, whose tags (llama.cpp `b<N>`) are monotonic.
