# ContainedPath

`core/shared/fs/ContainedPath.js`

Proves a path is strictly inside a root directory, so callers cannot escape a
workspace, extension or game folder with `..` or an absolute path.

## Methods

- `ContainedPath.isWithin(root, candidate)` returns true only when `candidate`
  is strictly below `root`. False for equality, for an escape, for another
  drive, and for non-string or empty input.
- `ContainedPath.resolveWithin(root, relPath, { label = 'workspace' })` resolves
  `relPath` under `root` and returns the absolute path. Throws
  `A file path is required` for a missing or non-string path,
  `Path must be relative, got "..."` for an absolute one, and
  `Path "..." escapes the <label>` when it leaves or equals the root.
- `ContainedPath.isImmediateChild(root, candidate)` is true only one level
  below `root`, for ids that must name a single directory.

## Why

One technique (`path.relative`) replaced three drifted ones. The retired
`startsWith(root + sep)` form is correct only because the separator is
appended, and that detail is easy to drop when the line is copied
(`/srv/extensions-evil` must not count as inside `/srv/extensions`).

Equality is not containment. The old ExtensionManager guards disagreed:
delete refused the root itself, renderer-source lookup allowed it (and then
hit EISDIR). The strict rule is the safe one.

The check is lexical and does not call `realpath`: a symlink inside the root
that points outside it passes. That matches every replaced call site; callers
needing more must resolve real paths first.
