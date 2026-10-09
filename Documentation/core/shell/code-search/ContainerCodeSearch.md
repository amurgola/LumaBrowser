# ContainerCodeSearch

`core/shell/code-search/ContainerCodeSearch.js`

Code search for a project inside a Docker container: one in-container find or grep per query through
[ContainerSearch](../ContainerSearch.md), because walking the tree would cost a docker exec per directory.

## Methods

- `ContainerCodeSearch.find(rootDir, options)` lists up to 50000 files, filters by glob, sorts and caps them; returns
  `{ files, limitReached, skippedDirs }`. `limitReached` is also true when the listing itself was capped.
- `ContainerCodeSearch.grep(rootDir, options)` returns `{ matches, limitReached, scanned: 0, skippedDirs }`. The
  pattern is compiled locally first so a missing or invalid one fails before any exec, exactly as on the host. A grep
  error in the container is thrown.

Skip dirs are pruned in the container with the same [SearchSkipDirs](../SearchSkipDirs.md) list as the host.
