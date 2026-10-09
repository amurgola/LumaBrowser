# RendererSource

`core/shell/extensions/RendererSource.js`

Reads a user-installed extension's declared renderer script for inline injection.

## Methods

- `RendererSource.read(id, manifest)` -> `{ success: true, content }`, or
  `{ success: false, error }`: `Extension "<id>" not found`,
  `Extension "<id>" has no renderer`, `renderer path escapes the extension
  directory` (strict containment, so the directory itself is refused too), or
  the read error.
