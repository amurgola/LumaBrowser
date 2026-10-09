# TaskRunList

`extensions/timed-tasks/ui/TaskRunList.js`

The run history under an expanded timed-task row.

## Methods

- `new TaskRunList(invoke)`.
- `load(taskId, runsEl)`: fetches `getTaskRuns(taskId, 6, page * 5)` (one
  extra to know whether an older page exists) and renders five runs: status
  badge, start time, duration ([RunDuration](RunDuration.md)), webhook badge,
  Copy log, and a preview (the error for a failed run, else the first 160
  characters with `...`; clicking a longer run toggles the full response).
  Newer/Older buttons page through; the range reads `1 to 5`. No runs on the
  first page shows `No runs yet. Click Run to try it now.`; a failure shows
  `Could not load runs.`
- `resetPage(taskId)`: back to the newest page.

Copy log fetches `getRunLog(runId)`, formats it with
[RunLogMarkdown](RunLogMarkdown.md) and copies it with
`window.electronAPI.copyToClipboard` when the preload offers it, else
[Clipboard](../../../core/llm-server/ui/js/dom/Clipboard.md)`.copyText`. The
button shows `Copying`, then `Copied`, `No data` or `Failed` for 1.5 s.

## Globals

Reads `window.electronAPI.copyToClipboard`, `navigator.clipboard` (through Clipboard).
