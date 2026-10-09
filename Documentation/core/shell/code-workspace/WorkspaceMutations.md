# WorkspaceMutations

`core/shell/code-workspace/WorkspaceMutations.js`

The coding agent's file writes and edits inside one workspace directory, for
[CodeWorkspace](../CodeWorkspace.md). Every mutation of a path runs in one
[FileMutationQueue](../FileMutationQueue.md) slot and passes the
[ReadGuard](ReadGuard.md) inside it.

## Methods

- `new WorkspaceMutations({ fsOps, guard })`.
- `WorkspaceMutations.validate(relPath, content)`: `CodeValidator.validate` with
  the language from the filename.
- `writeText(dir, relPath, content)` (async): guard, validate, write (creating
  parents), observe. Returns the write result with a diff basis
  (`ToolPresentation.withDiffBasis`, `before = null` for a create).
- `writeBytes(dir, relPath, bytes, { overwrite })` (async): no validation;
  refuses a directory (`FS_IS_DIRECTORY`) and an existing file without
  `overwrite` (`FS_EXISTS`); observes what it wrote.
- `edit(dir, relPath, edits)`: missing file, then guard, then
  [FileEdit](../FileEdit.md)`.apply`, write, observe, validate. Returns the edit
  result with a diff basis. A path escape throws synchronously (legacy shape).

Results are documented on [CodeWorkspace](../CodeWorkspace.md).

## Why

writeFile used to bypass the queue, so with two sub-agents on one file the
survivor depended on how long ESLint took. The guard runs inside the lock so a
queued write is judged against the file as it is when its turn comes, and before
any literal matching so a moved file is reported as moved. Validation never
blocks a write. Raw bytes need an explicit overwrite because the guard cannot
vouch for a binary the model never read.
