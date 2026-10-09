# FileGlobMatcher

`core/llm-server/chat/triggers/file/FileGlobMatcher.js`

Builds the matcher for a file trigger's glob (picomatch).

## Methods

- `FileGlobMatcher.create(glob, platform = process.platform)` returns
  `(relPath) => boolean`. A glob without `/` matches the file name at any
  depth (`*.csv` matches `sub/b.csv`); a glob with `/` matches the relative
  path. An empty glob is `*`. Dotfiles never match the trigger glob. Matching
  is case-insensitive on Windows.
- `FileGlobMatcher.IGNORE_GLOBS`: Office lock files (`~$*`, `.~lock*`), `*.tmp`,
  partial downloads (`*.crdownload`, `*.part`, `*.partial`), `.DS_Store`,
  `Thumbs.db`. These never match: they never mean "a file arrived".
- `FileGlobMatcher.toPosix(relPath)`: platform separators to `/`.
