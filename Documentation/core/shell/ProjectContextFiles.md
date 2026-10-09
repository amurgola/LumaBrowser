# ProjectContextFiles

`core/shell/ProjectContextFiles.js`

Collects the instruction files a project leaves for coding agents and renders them as a prompt block.

## Methods

- `ProjectContextFiles.collect(rootDir, { fsOps, maxBytes, maxDepth })` returns
  `{ files: [{ path, content, truncated }], totalBytes }`. Junk or missing roots return `{ files: [], totalBytes: 0 }`.
- `ProjectContextFiles.render(collected)` returns a `<project_context>` block with one
  `<project_instructions path="...">` per file, or `''` when there are none.
- `ProjectContextFiles.CANDIDATES` is `['AGENTS.override.md', 'AGENTS.md', 'CLAUDE.md', 'LUMA.md']`.
- `ProjectContextFiles.DEFAULT_MAX_BYTES` (16 KiB) and `DEFAULT_MAX_DEPTH` (8).

## Behaviour

- Walks from the project root UP to the directory holding `.git` (or the depth cap when there is none). Directories
  above the git root are never read.
- The first candidate name found per directory wins, so a repo that keeps both AGENTS.md and CLAUDE.md is not read
  twice. Directories named like a candidate are skipped.
- Files are returned farthest first, project root last, so the most specific instructions are the last thing the
  model reads.
- Whitespace-only files are skipped. One byte budget is shared by all files; the file that crosses it is clipped on a
  line boundary and marked `truncated`, and the walk stops.

## Why

The file names are the ones the ecosystem has settled on. The cap exists because a novel-length CLAUDE.md is a prompt
problem, not something to inject wholesale.

## Bug fixed in the port

Clipping cut the UTF-8 bytes and decoded them; a cut inside a multi-byte character became a 3-byte replacement character, so the clipped text could exceed the budget and `totalBytes` could exceed `maxBytes`. The clip now drops characters until it fits.
