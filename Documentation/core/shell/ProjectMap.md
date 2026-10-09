# ProjectMap

`core/shell/ProjectMap.js`

Builds a quick structural overview of a project so the coding agent can orient itself in one call.

## Methods

- `new ProjectMap({ search })` where `search` is a CodeSearch (anything with
  `find(root, { maxResults }) -> { files, limitReached }`). Throws without one.
- `await map.build(rootDir)` returns `{ fileCount, limitReached, byExtension, topDirs, entrypoints, manifests, readme }`.
  - `byExtension` and `topDirs` are `[{ name, count }]`, count descending then name. Root-level files count under
    `(root)`. Dotfiles and extensionless files have no extension.
  - `entrypoints` are `index|main|app|cli|server.<ext>` at the root or in `src/`.
  - `manifests` are root-level package.json, pyproject.toml, Cargo.toml, go.mod, pom.xml, build.gradle.
  - `readme` is the first root README(.md|.txt), or null.
- `ProjectMap.MAX_FILES` (2000) caps the walk; large monorepos report `limitReached`.

## Why

Deliberately lightweight: no embeddings and no parsing, just CodeSearch's vendored-dir-skipping walk aggregated. The
agent still drives deeper analysis with grep and read.

## Bug fixed in the port

The manifest set holds lowercase names (`cargo.toml`) but legacy compared the raw path, so the canonical `Cargo.toml` never matched. Manifest names now match case-insensitively.
