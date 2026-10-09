# ToolResultSpill

`core/llm-server/chat/ToolResultSpill.js`

Where an over-budget tool result goes instead of the bin. The FULL result is
written to disk and the model is shown its path plus a JSONPath outline
([JsonOutliner](JsonOutliner.md)), so it can read or grep the rest instead
of guessing.

## Where files land

- A conversation that works in a folder (Code mode's project, Game mode's game
  dir) spills to `<root>/.luma/tool-results/<conversationId>/`, the only place
  the mode's root-jailed `read_file` / `grep` can reach. The model is shown the
  workspace-relative path. In a git project `.luma/` is added to
  `.git/info/exclude` once ([GitExclude](spill/GitExclude.md)); the user's
  `.gitignore` is never edited.
- Any other conversation spills to `<appBaseDir>/tool-results/<conversationId>/`
  and is shown the absolute path. Browser-mode tools cannot read it back, but
  the sketch and the "re-query narrower" hint still help, and the file is there
  for the user and `luma trace`.

File name: `<turnId>_<seq>_<tool>.json|txt`. One directory per conversation,
so the delete cascade is one `rmSync`.

## Methods

- `ToolResultSpill.createWriter({ conversationId, turnId, workspaceRoot })`
  returns a [SpillWriter](spill/SpillWriter.md) for one agent run.
- `ToolResultSpill.deleteFor(conversationId, { workspaceRoot })` removes that
  conversation's app-owned dir and, when given, its workspace dir. Does nothing
  for an empty id.
- `ToolResultSpill.wipeAll()` removes the whole app-owned tree.
- `ToolResultSpill.appOwnedBase()`: the override, else
  `<appBaseDir>/tool-results` via [AppOwnedDir](AppOwnedDir.md) (`null` under jest).
- `ToolResultSpill.setBaseDir(dir)`: spill under `<dir>/tool-results` (tests);
  `null` restores the default.
- Constants: `SUBDIR`, `WORKSPACE_DOTDIR`, `MAX_SPILL_BYTES` (32 MB per result).

## Why

Writes are synchronous and best-effort: a spill failure returns `null` and the
caller falls back to the old in-place shrink. Nothing here can fail a turn.
