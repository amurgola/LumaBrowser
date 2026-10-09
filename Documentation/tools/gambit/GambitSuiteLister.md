# GambitSuiteLister

`tools/gambit/GambitSuiteLister.js`

Renders the gambit suite for `run-gambit --list`: each group with its task count, one line per task (id padded to
34, turn count, `requires:` capabilities), then `N tasks, M turns total`.

## Methods

- `GambitSuiteLister.format(tasks)` returns the text (tasks from `GambitRunner.loadSuite()`).
