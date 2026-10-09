# ExecutionCheck

`core/llm-server/gambit/ExecutionCheck.js`

Runs the JavaScript a model wrote during a gambit task and grades each case's result.

## Methods

- `ExecutionCheck.runExecutionCheck(task, transcripts)` (async) - `task.execute` is
  `{ source: 'artifact' | 'live', cases?: [{ args, expect }] }`. Returns
  `{ ran, from?, cases: [{ passed, detail }], error? }`. `ran: false` when the task has no
  execute block or the model produced no code. With no cases, the single case is "loads
  without throwing". The result feeds `transcript.execution`, which [TurnChecks](../eval/TurnChecks.md) grades.
- `ExecutionCheck.extractCode(task, transcripts)` returns `{ code, from }`: the first non-blank
  `create_artifact.content` (or `create_live_artifact.js` for live), else the first fenced
  ```` ```js ```` block in a final answer (`from: 'chat code fence'`), else nulls.
- `ExecutionCheck.checkCase(expect, value)` - `{ equals }` (deep JSON equality),
  `{ lastEquals }` (last array element), `{ contains }` (substring of the serialized value).
  No expectation passes; an unknown one fails.

## Why

`validate_code` proves a snippet parses, not that it is correct, and "parses cleanly, returns
the wrong answer" is the most common way generated code fails. A grade that never executes
anything is grading syntax. JavaScript only: Python and C# would need interpreters the app does
not ship.

The code fence fallback exists because a model that ignored the artifact instruction still
wrote code, and grading correctness separately from tool choice is why those are two groups.

### Live modules

A live artifact is a script expecting `root`, `R`, `store`, `Chart` and `luma` to exist, not a
`run()` function. It is wrapped in `run()` and handed [LiveArtifactStubs](LiveArtifactStubs.md)
as wrapper PARAMETERS. That detail is the point: the real runtime binds those names, so
`const R = ...` is a redeclaration SyntaxError in the app. Injected as globals, the same line
would merely shadow and the grader would pass code that cannot load.
