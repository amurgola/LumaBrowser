# ImageDefaultsMarkup

`core/llm-server/ui/js/image-setup/ImageDefaultsMarkup.js`

Markup for the Image Defaults card.

## Methods

- `ImageDefaultsMarkup.pill(enabled, state, port)` returns `{ text, className }` ("off", "ready · :port", "starting…", "error", "stopped").
- `ImageDefaultsMarkup.modelGroups(models)`: `{ gen, edit, video }`; a unified generate+edit model (`supportsEdit`) is in both gen and edit.
- `ImageDefaultsMarkup.html({ enabled, state, server, installedRuntimes, models, defaults, autoUnloadMs, ramPinStatus })`.

## Globals

Reads `window.localStorage` through FoldMemory.
