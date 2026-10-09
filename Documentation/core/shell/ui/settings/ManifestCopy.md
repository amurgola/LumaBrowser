# ManifestCopy

`core/shell/ui/settings/ManifestCopy.js` (ES module)

Manifest text cleaned of em- and en-dashes for the Settings > Extensions screens, and the Back chevron.

## Methods

- `ManifestCopy.clean(text)`: an em-dash with its surrounding spaces becomes
  `': '`, an en-dash becomes `-`; null is `''`. The dash characters are built
  with `String.fromCharCode`.
- `ManifestCopy.BACK_ICON`: the inline SVG chevron.

## Globals

None.
