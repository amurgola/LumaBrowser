# SpillWriter

`core/llm-server/chat/spill/SpillWriter.js`

Writes one agent run's over-budget tool results. Built by
[ToolResultSpill](../ToolResultSpill.md)`.createWriter`.

## Methods

- `new SpillWriter({ location, turnId, maxBytes })`. `location` is
  `{ dir, displayBase, readable, gitRoot, excludePattern }`.
- `dir`: the spill directory, or `null` when there is nowhere to write.
- `readable`: true for a workspace spill the mode's read tools can reach.
- `write(tool, seq, content, ext = 'json')` writes
  `<turnId>_<seq>_<tool>.<json|txt>` (any other ext becomes json; a
  non-numeric seq becomes 0) and returns `{ absPath, displayPath, bytes,
  readable }`. `displayPath` is workspace-relative for a readable spill and
  absolute otherwise. Returns `null` when there is no dir, the content is over
  `maxBytes`, or any write fails.

## Why

The directory (and the git exclude rule) is created on the first write, so a
run that never spills leaves nothing on disk. Without a turn id the file prefix
is the current time.
