# RuntimeReleaseTag

`core/image-server/service/RuntimeReleaseTag.js`

Compares an installed image runtime's release tag with the minimum a model row
states, per tag scheme.

## Methods (all static)

- `SCHEMES`: `luma` (`luma-b<n>`, the LumaByte build) and `master`
  (`master-<n>` with an optional `-<commit>` suffix, the stock sd.cpp builds,
  for example `master-1086-465adf3`).
- `installedTag(runtime)`: `runtime.manifest.release.tag` from a detector row
  (the `manifest.json` [RuntimeManifest](../../shared/runtime/RuntimeManifest.md)
  writes at install), or null when the install has none (a registered or PATH
  binary).
- `parse(tag)`: `{ scheme, build }` or null.
- `isOlder(installedTag, minimumTag)`: true only when both parse in the same
  scheme and the installed build number is lower. Anything else, including a
  missing tag, an unknown scheme or a minimum in another scheme, is false.

## Why

ISSUES.md entry 11. Used by [PreferredImageRuntime](PreferredImageRuntime.md)
to skip or refuse a runtime older than a model's `minRuntimeTags`. The two
schemes number different things, so they are never compared with each other,
and an unreadable tag means "unknown, allow" so a hand-built binary is never
blocked on a guess.
