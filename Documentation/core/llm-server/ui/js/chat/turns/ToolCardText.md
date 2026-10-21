# ToolCardText

`core/llm-server/ui/js/chat/turns/ToolCardText.js`

A tool card's one-line detail: the target and live byte count while the call
assembles, then the validated structured card data (diff or read slices), the
tool's own summary, or its most identifying argument; while the tool runs, its
own progress rides after that (" · step 4 of 9"). Persisted metadata in a
shape this build does not understand degrades to the summary.

## Methods

- `ToolCardText.detail(step)`, `ToolCardText.meta(step)`,
  `ToolCardText.metaDetail(step)`, `ToolCardText.chars(n)`.
- `ToolCardText.progress(progress)`: a running step's `_progress` as words:
  its `message`, else `step N of M` (rounded, M > 0), else the `elapsedMs` as
  `elapsed`; `''` otherwise. Only a step whose status is `run` shows it.
- `ToolCardText.elapsed(ms)`: "8s", "1m 05s".
