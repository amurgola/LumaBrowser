# TestDiscovery

`extensions/ext-test-harness/lib/TestDiscovery.js`

Finds harness tests: every `<extensionsDir>/<ext>/tests/*.test.js` exporting a
descriptor with `id`, `name` and `run()`.

## Methods

- `new TestDiscovery(extensionsDir)`.
- `scan()`: `[{ id, name, suite (default the extension folder), filePath,
  variants (default []), timeout (default 300000) }]`. Files missing a field
  are skipped with a warning; files that fail to load are logged and skipped;
  an unreadable folder scans as empty.
- `loadTest(testId)`: `{ descriptor, filePath }` or null.

## Why

Each scan deletes the file from `require.cache` first so an edited test is
picked up without restarting the app. (Jest has its own module registry, so
that re-read cannot be unit tested.)
