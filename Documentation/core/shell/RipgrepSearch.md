# RipgrepSearch

`core/shell/RipgrepSearch.js`

Regex content search backed by the packaged ripgrep binary, with the same result shape as `CodeSearch.grep`.

## Methods

- `new RipgrepSearch({ spawn, binaryPath })`; both optional (defaults: `child_process.spawn`,
  [RipgrepBinary](RipgrepBinary.md)`.path()`).
- `search.grep(rootDir, { pattern, glob, ignoreCase, maxMatches = 100 })` resolves
  `{ matches: [{ file, line, text }], limitReached, scanned }`. Rejects when ripgrep is unavailable. Reading the
  output is [RipgrepRun](RipgrepRun.md)'s job.
- `RipgrepSearch.buildArgs({ pattern, glob, ignoreCase })` returns the argv (pure, so the flags are testable).
- `RipgrepSearch.available()` delegates to `RipgrepBinary.available()`.

## Why the flags

- `--no-config` on every spawn is load-bearing, not a preference: otherwise ripgrep reads `RIPGREP_CONFIG_PATH`, and
  that file can set `--pre`, which runs an arbitrary program for every file searched. The env also blanks
  `RIPGREP_CONFIG_PATH` as belt and braces.
- The binary is spawned with an argv array and no shell, so a model-chosen pattern has no quoting boundary to escape.
  `-e <pattern>` and `--` keep a pattern or path that starts with a dash from being read as a flag.
- `--no-require-git`: ripgrep otherwise honours `.gitignore` only inside a git repository, while the Node walk applies
  it whenever the file exists. Without this the backends disagree for exports, worktree copies and uninitialised
  folders.
- `--stats` keeps `scanned` meaning what the Node walk reported; `--max-filesize 2M` matches its per-file ceiling.
- Each skip dir from [SearchSkipDirs](SearchSkipDirs.md) is excluded in two forms: `!**/dir` prunes during
  traversal, `!**/dir/**` still excludes contents when the search root is inside one. A glob that literally names a
  skip dir opens it.

A caller cannot tell which backend answered, which is what makes falling back to the Node walk safe on platforms
without a binary.
