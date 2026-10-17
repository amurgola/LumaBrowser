# DefaultsCardHtml

`core/llm-server/ui/js/setup-ui/defaults/DefaultsCardHtml.js`

The Defaults card body and all its help copy.

## Methods

- `html(rows, view)`; `HELP` (every "?" explanation). When `view.openvino` is set, an "OpenVINO device" segmented row (`defaultOpenVinoDevice`, help `HELP.openvinoDevice`) follows the runtime select.
- With a default model, the "More settings" fold ends with a "This model only" row: a "Tune this model…" button (`data-tune-model="local::<stem>"`, help `HELP.tune`) that opens the per-model Tune dialog. Extra llama.cpp flags are edited there now, not in the card.

## Globals

None (FoldMemory reads `localStorage`).
