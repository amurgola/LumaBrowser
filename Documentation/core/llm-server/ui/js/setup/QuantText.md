# QuantText

`core/llm-server/ui/js/setup/QuantText.js`

Plain-language glosses for GGUF quant tags (tooltips on the wizards' quant
badges).

## Methods

- `QuantText.title(quant)`: the upper-cased tag plus a gloss for full precision
  (F16, FP16, BF16, F32), Q8, Q6, Q5, Q4/IQ4 ("the balanced default"), other
  IQ/Q2/Q3 ("aggressive quantization"), or a generic variant line; `''` for no
  tag.

## Globals

None.
