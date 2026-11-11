# ModelTree

`core/llm-server/ui/js/models/ModelTree.js`

The one grouping and ordering every local LLM list renders from: the Setup installed models
([LlmModelRow](../setup-ui/models/LlmModelRow.md)), the Defaults dropdown
([DefaultsOptions](../setup-ui/defaults/DefaultsOptions.md)) and the chat model picker in the composer, the gear
panel and the landing ([LocalModelRows](../chat/composer/LocalModelRows.md)). Placement comes from each model's
`grouping`, set by the main process ([ModelGrouping](../../../models/ModelGrouping.md)); this module only builds and
orders the tree and names a row. The lists differ only in how they draw it (a native dropdown uses one optgroup per
family and line; the interactive lists use headings).

## Methods

All static.

- `build(items, { bytesOf })` resolves `[{ family, lines: [{ line, items }] }]`: families in natural order
  (Qwen 3.6 before Qwen 3.8) with `Other` (`OTHER`) last; lines largest size first, size-less lines after them by
  name; items largest quant first (`quantBits`), then the larger file (`bytesOf`, default `totalBytes`), then the
  variant.
- `flatten(tree)` the tree in display order as `{ item, family, line, firstOfFamily, firstOfLine, familyCount,
  lineCount }`.
- `groupingOf(m)` the placement with safe defaults (an ungrouped entry lands under Other, named by its display name).
- `rowName(m)` what a row shows under its headings: the variant, else the quant, else the line, else the label.
- `showsQuant(m)` whether a quant chip belongs beside the name (not when the name is the quant).
- `label(m)` the unique one-line name for pills and tooltips; `heading(family, line)` "Qwen 3.8 · 27B".

## Globals

None.
