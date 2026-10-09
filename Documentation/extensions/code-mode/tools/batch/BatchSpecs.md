# BatchSpecs

`extensions/code-mode/tools/batch/BatchSpecs.js`

The dispatch_batch task specs and the digest the parent agent reads.

## Methods (static)

- `validate(specs)` -> an error string or null: a non-empty array; each task an
  `instruction`; `kind` `explore` or `edit`; an edit task must list `files`.
- `toSchedulerTasks(specs)` -> `[{ id: 't1'.., kind, files, instruction }]`.
- `summarize(tasks, results)` -> `Ran N sub-task(s) in parallel (review and continue):`
  plus one line per task: `[tN kind] done | error: <e> | FAILED: <e>`, changed
  files, and the indented report.
- `clip(text)`: reports above `MAX_BODY_CHARS` (24000) are cut with a note
  saying how much was lost and to re-run narrower.
