# ImageDefaultsCard

`core/llm-server/ui/js/image-setup/ImageDefaultsCard.js`

The Image Defaults card: enable switch, runtime and per-job model selectors (generation, edit, video), the "More settings" fold (RAM pin, 15-minute auto-unload) and Start or Stop server. Each change saves through the image API, reloads the affected state (even when the IPC threw) and repaints.

## Methods

- `paint()` (also refreshes the RAM-pin hint and the Models card's installed-models chip).

## Globals

None.
