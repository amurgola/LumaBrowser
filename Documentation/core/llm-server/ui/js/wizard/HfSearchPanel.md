# HfSearchPanel

`core/llm-server/ui/js/wizard/HfSearchPanel.js`

The live Hugging Face search under the recommendation: Search or Enter, results with downloads and gated marks, a repo opens its quants once (multi-part quants are refused with "paste URL"), and a pick becomes `state.override` (MLX picks carry `runtimeId: 'mlx-lm'`) with a Clear chip. Toggling MLX (Mac only) clears a pick.

## Methods

- `new HfSearchPanel(wizard, host, isMac?).mount()`; `search()`; `HfSearchPanel.override(info, variant)`.

## Globals

Reads `navigator` when `isMac` is not given.
