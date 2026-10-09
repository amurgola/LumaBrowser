# ToolCardText

`core/llm-server/ui/js/chat/turns/ToolCardText.js`

A tool card's one-line detail: the target and live byte count while the call
assembles, then the validated structured card data (diff or read slices), the
tool's own summary, or its most identifying argument. Persisted metadata in a
shape this build does not understand degrades to the summary.

## Methods

- `ToolCardText.detail(step)`, `ToolCardText.meta(step)`,
  `ToolCardText.metaDetail(step)`, `ToolCardText.chars(n)`.
