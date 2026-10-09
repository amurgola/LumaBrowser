# CtxFitMatrix

`core/llm-server/ui/js/setup-ui/models/CtxFitMatrix.js`

The "GPU fit by context" block on a model row: pills per KV mode coloured by the launch planner, a measured or predicted speed chip, and the MTP overhead note.

## Methods

- `html(model, opts)`: `''` unless parsed weights with ladders; `speedChip(speed)`; `DEFAULT_KV_MODES` for payloads without `kvModes`. Pill labels and row labels are now escaped too.

## Globals

None.
