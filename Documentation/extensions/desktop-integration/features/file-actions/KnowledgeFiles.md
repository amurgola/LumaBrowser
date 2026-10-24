# KnowledgeFiles

`extensions/desktop-integration/features/file-actions/KnowledgeFiles.js`

The documents a [file-actions](index.md) selection adds to a knowledge base.

- `collect(items, { maxFiles, fsImpl })` resolves
  `{ files, skipped, truncated }`: supported files (DocumentParser: Markdown,
  text, HTML, PDF; up to 20 MB) as given, and those inside selected folders,
  walked breadth-first to `MAX_DEPTH` (4), sorted by name. Dot-named entries,
  empty files and `SKIP_DIRS` (node_modules, .git, build output) are skipped;
  symbolic links are not followed. Stops at `maxFiles` (`truncated`).
