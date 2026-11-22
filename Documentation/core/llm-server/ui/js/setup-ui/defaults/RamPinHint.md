# RamPinHint

`core/llm-server/ui/js/setup-ui/defaults/RamPinHint.js`

The "RAM pin" row's caption: pin progress, pinned size or refusal; keeps polling while enabled but not yet started.

## Methods

- `new RamPinHint(ctx, prefs)`; `paint(hint, status)`; `gb(bytes)`; refreshes `prefs.ramPinStatus`.

## Globals

Reads `#ramPinHint`.

## Changes (2026-11-22, framework refactor)

The RAM pin row moved to the Frameworks card; [RuntimesCard](../runtimes/RuntimesCard.md) owns the hint now (with `ctx.prefs`). `#ramPinHint` is drawn only in the frame of the framework that serves the default model, so the id stays unique.
