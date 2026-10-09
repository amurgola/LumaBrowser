# RuntimeTraceMarkdown

`core/diagnostics/RuntimeTraceMarkdown.js`

Renders a RuntimeTraceSummary json as `summary.md` and as the one-line headline.

## Methods

- `RuntimeTraceMarkdown.render(summary)` sections: title and notes, headline,
  shell renderer counters (and slow input events), main process event loop,
  threads by task wall time, self time and longest tasks for the shell UI
  thread and the main process thread, both CPU profiles, processes.
- `RuntimeTraceMarkdown.headline(summary)` e.g.
  `UI thread: 1 long tasks, worst 80ms | main loop: worst 72ms | top UI self time: Layout 70ms`.
- `RuntimeTraceMarkdown.table(rows, columns)` a markdown table; `columns` is a
  list of `[key, label]`; empty rows render `_none_`.
