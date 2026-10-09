# InstallEvents

`core/shared/runtime/install/InstallEvents.js`

The install progress sink and the fields its events carry.

## Methods

- `InstallEvents.emitter(onEvent)` returns `(type, payload)` that calls
  `onEvent(type, payload || {})` when it is a function and swallows its errors.
- `InstallEvents.releaseFields(release)` -> `{ tagName, name, publishedAt, url }`.
- `InstallEvents.assetFields(asset)` -> `{ name, size, contentType, url }`.

## Why

A renderer that went away mid-install must not abort the install.
