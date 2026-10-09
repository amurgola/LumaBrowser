# MusicRuntimeUpdates

`core/music-server/runtimes/MusicRuntimeUpdates.js`

Update check for python-env music runtimes. Polls the PyPI JSON API behind a
TTL cache and decorates runtimes-view rows with the same `update` block the
runtime cards render for GitHub-release runtimes.

## Methods

- `new MusicRuntimeUpdates({ catalog?, http? })`: `catalog` defaults to
  `new MusicRuntimeCatalog()`, `http` to axios (test seam). The cache lives on
  the instance, so the owner (the music server service) keeps one instance.
- `check({ view, userAgent })` mutates and returns `view`. Eligible rows are
  `installed`, `acquisition: 'python-env'`, `source: 'managed'`, with a catalog
  `pypi.project` and a version (`row.version`, else `row.manifest.package.version`).
  Each gets `update = { available, current, latest, url }`, or on failure
  `{ available: false, current, latest: null, error }` (error max 200 chars).
  A view without a `runtimes` array is returned untouched.
- `latestVersion(project, { userAgent })` reads
  `https://pypi.org/pypi/<project>/json` (`User-Agent` defaults to
  `LumaBrowser`, 15 s timeout), cached for `TTL_MS` (6 h). Throws
  `PyPI returned no version for <project>.` when `info.version` is missing.
- `clearCache()` empties the cache.
- `MusicRuntimeUpdates.compareVersions(a, b)`: loose numeric dot-segment
  compare; the sign is the answer (`1.0` equals `1.0.0`).

## Why

The shared [RuntimeUpdateChecker](../../shared/runtime/RuntimeUpdateChecker.md)
groups rows by GitHub repo and compares release tags; a pip-installed runtime
has neither, so the music side polls PyPI with the same TTL pattern and the
same per-row decoration. Fail-soft per row: a PyPI outage degrades to "no update
info", never an error.
