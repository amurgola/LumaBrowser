# TokenSizeLabel

`core/llm-server/chat/outline/TokenSizeLabel.js`

Approximate token counts for the model.

## Methods

- `TokenSizeLabel.format(tokens)`: exact below 100, otherwise two significant
  figures with thousands separators (`520`, `4,300`, `1,200,000`).
- `TokenSizeLabel.ofText(text)`: estimate at
  the shared `TokenEstimator` ratio, then format.

## Why

The counts are estimates; two significant figures say so without a unit
suffix the model might misread. Used by the spill header
([ToolResultCompactor](../../agent/ToolResultCompactor.md)) and
[TruncationNotice](../tool-output/TruncationNotice.md).
