# ChromeExtensionManifest

`core/chrome-extensions/ChromeExtensionManifest.js`

Reads an unpacked Chrome extension's `manifest.json`.

## Methods

- `ChromeExtensionManifest.read(dirPath)` returns the parsed manifest. Throws
  `manifest.json not found in <dir>` when the file is missing.
- `ChromeExtensionManifest.parse(raw)` strips comments and parses; throws
  `Invalid manifest.json: <reason>`.
- `ChromeExtensionManifest.stripComments(raw)` removes `/* */` blocks and `//`
  comments that start a line or follow whitespace.

## Why

Chrome accepts comments in `manifest.json` and some published extensions ship
them. A line comment must start a line or follow whitespace so the `//` inside
`"https://..."` (preceded by a colon) survives.
