# SourceTree

`tools/build/bytecode/SourceTree.js`

A read-only view of an app source tree for the build tools. Lists `.js` and
`.html` files as root-relative POSIX paths, skipping `node_modules` and `.git`
at any depth and the given top-level folders, and reads each file once (cached).

## Methods

- `new SourceTree(root, { ignoreTopDirs, files })`: `files` replaces the walk
  with an explicit list (the verifier passes the listing of a packed app.asar).
- `jsFiles()`, `htmlFiles()`, `has(rel)`, `read(rel)` (empty string when
  missing), `abs(rel)`, `relative(absPath)` (null outside the tree).
