# ReadGuard

`core/shell/code-workspace/ReadGuard.js`

The read-before-mutate guard of [CodeWorkspace](../CodeWorkspace.md): an existing
file may only be overwritten or edited when the agent has read the version now on
disk. Wraps a [FileObservation](../FileObservation.md) ledger.

## Methods

- `new ReadGuard({ fsOps, enforce = true })`.
- `observe(absPath, knownText)`: records the file as seen. `knownText` (the text
  the caller holds after a read, write or edit) makes the stamp exact and free;
  without it the file is read, falling back to the stat stamp.
- `refusal(absPath, relPath, verb)`: `null` to proceed, or `{ code, error }`:
  - `FS_NOT_OBSERVED`: `<Verb> refused: <rel> already exists and has not been read in this session. (FS_NOT_OBSERVED) Read the file first, then retry.`
  - `FS_STALE_VERSION`: `<Verb> refused: <rel> is not the version you read. (FS_STALE_VERSION) The file changed since you read it. Read it again, then retry.`
  Always null when `enforce` is false, the file does not exist, or it cannot be stamped.
- `forgetUnder(absDir)`, `stat(absPath)` (null when missing).

## Why

The agent runs unattended: a write is a full overwrite with no diff and no
backup, and an edit against a moved file used to fail as "could not find
oldText", sending the model to fix a string problem that did not exist. The
refusal is a result, never an exception, because it is a routine recoverable
outcome; each message carries the code and the next step, since a bare code
teaches a local model nothing. Content stamps beat stat stamps (see FileObservation).
