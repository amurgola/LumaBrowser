# WriteSnapshots

`core/llm-server/ui/js/code/WriteSnapshots.js`

The text each file had before the agent last wrote it (at most 40, oldest
evicted). Taken at the approval prompt when there is one, else at 'run'.

## Methods

- `record(path, phase, readText)` returns `true` for 'approval' and 'run'
  (snapshot taken unless held from approval) and releases the hold otherwise;
  `has(path)`, `get(path)`, `clear()`.
