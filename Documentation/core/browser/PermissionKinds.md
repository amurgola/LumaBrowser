# PermissionKinds

`core/browser/PermissionKinds.js`

Reads web permission requests into the terms PermissionManager decides on: the
requesting origin, the kinds asked for (camera, microphone, notifications), and the prompt wording.

## Methods

- `PermissionKinds.originOf(url)` returns the URL's origin, `'file://'` for any file
  URL (the app's own UI counts as one origin), or null for opaque/invalid input.
- `PermissionKinds.kindsOf(permission, details)` returns `['notifications']`, `['camera']`,
  `['microphone']`, the kinds named by `details.mediaTypes` for `media` (video ->
  camera, audio -> microphone, both when none are recognised), or null for any
  other permission.
- `PermissionKinds.kindsOfCheck(mediaType)` the same for a check handler's single
  `details.mediaType`.
- `PermissionKinds.describe(kinds)` the prompt phrase, e.g. `use your camera and microphone`
  or `show notifications`.
- `PermissionKinds.isExtensionUrl(url)` true for `chrome-extension://` URLs.
- `PermissionKinds.hostOf(origin)` host (with port) for the prompt, or the origin itself.
- Constants: `MEDIA_KINDS` (`['camera', 'microphone']`), `APP_ORIGIN` (`'file://'`),
  `NOTIFICATIONS`, `EXTENSION_PREFIX`.

Returned kind arrays are always fresh copies.
