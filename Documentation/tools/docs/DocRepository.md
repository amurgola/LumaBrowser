# DocRepository

`tools/docs/DocRepository.js`

One project root as the docs tools see it. `listDocs` walks `Documentation/` for `*.md` (skipping
`node_modules` and dot folders); `loadDocs` keeps the docs whose front matter declares `applies_to`, each as
`{ file, patterns, meta, match }` (`meta` when `scope: meta`; `match` holds compiled [DocGlob](DocGlob.md)
matchers). `expandInput` turns a file or directory argument into root-relative files: paths outside the root and
non-directories pass through, directories expand through `git ls-files`, untracked ones by walking.
`changedPaths` unions `git diff --name-only`, `git diff --cached --name-only` and untracked files, sorted.

## Methods

- `static findRoot(start, fallback)`: `git rev-parse --show-toplevel`, else the repo this file lives in.
- `new DocRepository(root)`; `root`, `listDocs()`, `loadDocs()`, `expandInput(input, cwd = process.cwd())`,
  `changedPaths()`.
- Constants: `DOC_ROOT` (`'Documentation'`), `SKIPPED_DIRS`.
