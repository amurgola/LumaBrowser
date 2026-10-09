# ProjectWalker

`core/shell/code-search/ProjectWalker.js`

Async depth-first walk over a project's files for the Node search backend.

## Methods

- `new ProjectWalker(rootDir, { ignore = null, allowDirs = new Set() })`. `ignore` is a
  [GitignoreFilter](../GitignoreFilter.md) or null; `allowDirs` holds skip dirs the query's glob named explicitly.
- `await walker.walk(visit)` calls `await visit(abs, rel)` for every file; `rel` is relative to the root with `/`
  separators. Returning `false` stops the whole walk.

## Rules

- A directory in [SearchSkipDirs](../SearchSkipDirs.md) is not entered unless it is in `allowDirs`.
- Ignored directories are pruned whole, not file by file, because build output can outnumber the source tree.
- Every 200 files (`ProjectWalker.YIELD_EVERY`) it yields to the event loop with `setImmediate`, so a large repo
  never freezes the Electron UI.
- An unreadable directory, including a missing root, is skipped.
