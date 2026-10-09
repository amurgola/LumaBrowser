# WholeReadGuard

`extensions/code-mode/tools/project/WholeReadGuard.js`

The "you already have this whole file" claim behind [ReadFileTool](ReadFileTool.md).

## Methods

- `new WholeReadGuard({ budgetChars, fsOps = ContainerFs.routed(fs) })`.
- `WholeReadGuard.budgetFor(ctxPerSlot, chunkMaxBytes)` -> `ContextBudget.resolveBudget({ ctxPerSlot }).toolHistoryChars`,
  floored at one bounded result (the chunk cap, else 8 KB); the floor alone without a window.
- `isHeld(s, relPath)` -> true only while the file's current stamp equals the
  served one AND `s.served - mark <= budgetChars`.
- `record(s, relPath, servedChars)` stores `{ stamp, at: s.served + servedChars }`.
- `forget(s, relPath)` (tolerates a missing session).
- `stamp(dir, relPath)` -> `FileObservation.stampOfText` of the content, else
  `stampOf(stat)`, else null (then the guard never fires).

## Why

Models re-page files they were just handed, so a redundant re-read gets a
pointer instead of the content. The claim must not outlive the truth: content
stamps (not per-session flags) catch a sub-agent's or the user's edit; the
served-text budget matches what the agent loop evicts against and scales with
the window (a flat call count expired four times early at 128k); the mark sits
past the file's own bytes so a big file does not expire as it is served; and
eviction drops the claim outright. The stamps are FileObservation's, the same
ones CodeWorkspace's read-before-edit ledger uses.
