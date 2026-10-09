# RamPinHint

`core/llm-server/ui/js/setup-ui/defaults/RamPinHint.js`

The "RAM pin" row's caption: pin progress, pinned size or refusal; keeps polling while enabled but not yet started.

## Methods

- `new RamPinHint(ctx, prefs)`; `paint(hint, status)`; `gb(bytes)`; refreshes `prefs.ramPinStatus`.

## Globals

Reads `#ramPinHint`.
