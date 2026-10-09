# ArtifactDataTransport

`core/llm-server/ui/js/artifacts/ArtifactDataTransport.js`

Base class (the interface) for how an [ArtifactDataStore](ArtifactDataStore.md)
talks to the host.

## Contract

- `all(rootId, since?)` resolves a snapshot `{ success, rootId, rev, data }`,
  `{ success: true, unchanged: true }` when nothing changed since `since`, or
  `{ success: false, error }`. Throws if not implemented.
- `mutate(rootId, { set?, remove? })` resolves the post-write snapshot or
  `{ success: false, error }`. Throws if not implemented.
- `canPush` getter: `true` when `subscribe(rootId, onDirty)` delivers host pushes
  and returns an unsubscribe function; `false` (default) makes the store poll.
  The base `subscribe` throws.
- `readOnly` getter (default `false`), `pollMs` getter (default
  `DEFAULT_POLL_MS`, 10 s).

Implementations: [IpcDataTransport](IpcDataTransport.md),
[HttpDataTransport](HttpDataTransport.md). The contract test is the
"ArtifactDataTransport contract" block in `ArtifactDataStore.test.js`.

## Globals

None.
