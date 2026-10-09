# LlmSplit

`core/llm-server/ui/js/setup-ui/advanced/LlmSplit.js`

Slicing the LLM's measured footprint: how much stays on its primary card and whether the overflow goes to another GPU (tensor-split ratio) or System RAM (a VRAM cap).

## Methods

- `open(model, fit)`: the editor state or null; `apply(model, editor)`: null or the reason; `clampBoundary(total, megabytes)`, `round1(x)`; `MIN_OVERFLOW_BYTES` (0.1 GB), `NEED_TARGET`, `APPLIED`.

## Globals

None.
