# ContainerSearch

`core/shell/ContainerSearch.js`

Tree-wide file listing and content search inside a Docker container, each as a single in-container `find`/`grep`.

## Methods

- `ContainerSearch.listFiles(container, posixRoot, { skipDirs, max = 5000 })` returns `{ files, limitReached }` with
  relative, `/`-separated paths and the skip dirs pruned.
- `ContainerSearch.grep(container, posixRoot, { pattern, ignoreCase, skipDirs })` returns
  `{ matches: [{ file, line, text }], error }`. Lines containing NUL (binary matches) are skipped. No matches is not an
  error; a failed grep with no output returns its stderr as `error`.
- `ContainerSearch.toEre(pattern)` translates the JavaScript escapes `\d \D \s \S` to POSIX ERE classes.

## Why

One `docker exec` costs hundreds of milliseconds, so walking a tree one call per directory is not an option.
`find ... -exec grep` is used instead of `grep -r --exclude-dir` because BusyBox grep (Alpine) has neither
`--exclude-dir` nor `-I`, while `find -prune` is everywhere. The search tool documents JavaScript regex, but POSIX ERE
has no `\d` or `\s`, hence `toEre`.
