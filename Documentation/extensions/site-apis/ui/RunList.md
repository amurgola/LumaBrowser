# RunList

`extensions/site-apis/ui/RunList.js`

The Runs history under an endpoint row: the last ten runs, newest first.

## Methods

- `new RunList(invoke)`; `load(endpointId, el)`: `listRuns(endpointId, 10)` rendered into `el`
  (`Could not load runs.` on a failure).
- `RunList.render(el, runs)`, `RunList.row(run)`: status badge (`ok`, `failed` red, `running` amber), a `test`
  badge for test runs, the start time (`TimeText.formatTime`), the duration (`StatusText.duration`) and, for a
  failed run, `code: message`. No runs shows `No runs yet. Click Run to try it now.`
- `RunList.badge(status)`.
