# SearchSkipDirs

`core/shell/SearchSkipDirs.js`

The directory names code search skips by default, and the rule for when a caller's glob explicitly asks for one.

## Methods

- `SearchSkipDirs.NAMES` (frozen): node_modules, .git, .hg, .svn, dist, build, out, .next, coverage, .cache, .idea,
  .vscode, `__pycache__`, vendor, .venv.
- `SearchSkipDirs.isSkipped(name)` is an exact-name check.
- `SearchSkipDirs.explicitDirAllowances(glob)` returns the Set of skip-dir names the glob names in a LITERAL path
  segment (`build/**` allows `build`; `**/x`, `bui*/x` allow nothing).
- `SearchSkipDirs.effectiveFor(glob)` is `NAMES` minus those allowances.

## Why

A directory name is not proof of generated content: Electron keeps installer sources in `build/`, and plenty of repos
keep source in `vendor/`. Observed live, a find for `installer.nsh` answered "No files match" while
`build/installer.nsh` sat on disk, and the model concluded the file did not exist. A glob that names such a directory
is the caller asking for it. Only literal segments count; a wildcard is not an explicit ask. Naming one skip dir does
not open the others.

Both search backends (the Node walk in CodeSearch and [RipgrepSearch](RipgrepSearch.md)) must use this one list, or
they disagree about which files exist.
