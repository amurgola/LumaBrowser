# CodeSearch

`core/shell/CodeSearch.js`

Structured search over a project for the coding agent: regex content search, glob filename search and a one-level
listing, so the agent can analyze a codebase without an external ripgrep or fd on PATH.

## Methods

- `new CodeSearch({ useRipgrep = true, respectGitignore = true, fsOps = null, ripgrep = null })`.
  `useRipgrep: false` forces the Node walk. `respectGitignore: false` searches ignored paths. `fsOps` is the
  injectable fs used to read `.gitignore` (CodeWorkspace passes its routed fs). `ripgrep` replaces the
  [RipgrepSearch](RipgrepSearch.md) instance (a test seam).
- `await search.grep(rootDir, { pattern, ignoreCase, glob, maxMatches = 100 })` returns
  `{ matches: [{ file, line, text }], limitReached, scanned, skippedDirs }`. Throws `A search pattern is required`.
- `await search.find(rootDir, { glob, maxResults = 500 })` returns `{ files, limitReached, skippedDirs }`, files sorted.
- `await search.listDir(absDir)` returns `[{ name, type: 'dir' | 'file', bytes? }]`, directories first, then by name.

Paths in results are relative to the root and slash-separated on every platform. `skippedDirs` is
[SearchSkipDirs](SearchSkipDirs.md)`.effectiveFor(glob)`: an empty result from a search that never entered `build/`
reads as "the file does not exist", so every result says what was skipped. A glob that names a skip dir with a
literal segment (`build/**`) searches it.

## How a query is answered

- A container root ([ContainerPath](ContainerPath.md)) goes to [ContainerCodeSearch](code-search/ContainerCodeSearch.md):
  one in-container find or grep.
- `grep` on the host tries ripgrep first when the packaged binary exists. Any failure falls through to the walk,
  except "could not be parsed" and "read safely" errors, which are real answers about this search and are rethrown.
- Otherwise [ProjectWalker](code-search/ProjectWalker.md) walks the tree (skip dirs, `.gitignore`, event-loop yields)
  and [FileGrep](code-search/FileGrep.md) searches each file that passes the glob. Options are read by
  [SearchQuery](code-search/SearchQuery.md), so all three backends agree on what a query means.

The `.gitignore` filter is read once per root per instance. ripgrep honours `.gitignore` too, which keeps the two
backends returning the same files.

## Bug fixed in the port

Legacy translated `**/` to `.*`, so `**/installer.nsh` also matched `myinstaller.nsh` and `src/**/x.js` matched `src/foox.js`, while ripgrep matched whole names. Globs now go through [GlobPattern](GlobPattern.md), where `**/` matches whole directories only.
