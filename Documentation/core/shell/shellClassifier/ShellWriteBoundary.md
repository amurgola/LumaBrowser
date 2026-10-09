# ShellWriteBoundary

`core/shell/shellClassifier/ShellWriteBoundary.js`

Checks whether a command line's writes stay inside the allowed roots. The file tools already refuse to leave the
project; this extends the same boundary to the shell for the commands it can see.

## Methods

- `ShellWriteBoundary.check(command, cwd, allowedRoots, { dialect, env = process.env, platform })` returns
  `{ within, outside, unverifiable, dialect }`.
  - `allowedRoots` is an array (or a single root); the first is the project root. `cwd` defaults to it.
  - `within`: true only when nothing resolved outside and nothing was unverifiable.
  - `outside`: resolved absolute targets outside every root and temp dir (deduplicated).
  - `unverifiable`: descriptions of writes that could not be determined: unknown programs, targets with unresolved
    variables, and relative targets after a `cd` to an unknown place.
  - Without an explicit dialect it guesses, defaulting to the roots' platform.

## How it works

Walks the parsed simple commands in order:

1. Directory changes (`cd`, `Set-Location`, `pushd`, `popd`, ...) move [WorkingDirectoryTracker](WorkingDirectoryTracker.md).
2. Every redirect whose target is not a null device ([RedirectTarget](RedirectTarget.md)) is resolved and checked.
3. A recognised writer ([WriteTargets](WriteTargets.md)) has each target resolved and checked.
4. A known non-writer (read commands and builders that write only in their cwd, plus `get-`, `test-`, `select-`, ...
   verbs) is fine when its working directory is known and allowed; that directory is reported as outside otherwise.
5. Anything else is unverifiable.

Path rules follow the roots, not the host ([WritePathScope](WritePathScope.md)); env references expand through
[ShellPathExpander](ShellPathExpander.md). The temp dirs (`os.tmpdir()`, `/tmp`, `/var/tmp`, `/private/tmp`, `TEMP`,
`TMP`) are always allowed.
