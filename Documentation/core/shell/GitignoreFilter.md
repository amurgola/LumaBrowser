# GitignoreFilter

`core/shell/GitignoreFilter.js`

Honours a project's own root `.gitignore` when walking it, for the common subset of gitignore syntax.

## Methods

- `GitignoreFilter.forRoot(rootDir, fsOps = fs)` reads `<rootDir>/.gitignore`. A missing or unreadable file yields an
  empty filter, never an error. `fsOps` is the same injectable fs seam CodeWorkspace uses.
- `GitignoreFilter.parse(text)` builds a filter from file contents.
- `filter.ignores(relPath, isDir)` is true when the path is ignored. Accepts `\` separators and a leading `./`.
- `filter.empty` is true when there are no rules, so callers can skip the work.

## Supported

Comments and blank lines, negation (`!`), directory-only patterns (trailing `/`), root anchoring (leading `/` or any
interior slash, as git does), and `*`, `?`, `**` globs. Later rules win, including negations. Glob translation is
[GlobPattern](GlobPattern.md)`.toSource(body)` (no brace alternation, as in git), shared with CodeSearch.

Deliberately not supported: nested `.gitignore` files, the global excludesfile, `.git/info/exclude`, and character
ranges like `[a-z]` (treated as literal text). Each needs real git semantics, and being wrong about whether a file
exists is worse than ignoring a rule, so anything not understood filters nothing. The failure direction is always
"show the file".

## Why

The hardcoded skip list covers what is noise in most projects but not this project's own generated output (a Rust
`target/`, a vendored blob). Without this, `project_overview` described generated output as the codebase, and the
two search backends disagreed because ripgrep honours `.gitignore` by default.
