# IpcDataTransport

`core/llm-server/ui/js/artifacts/IpcDataTransport.js`

[ArtifactDataTransport](ArtifactDataTransport.md) over the preload's
`artifactData` surface (`{ all, mutate, onChanged }`), used by the LLM tab and
the Dashboard.

## Methods

- `new IpcDataTransport(api)`.
- `all(rootId)`, `mutate(rootId, ops)` forward to `api`.
- `canPush` is `true`; `subscribe(rootId, onDirty)` registers
  `api.onChanged` and calls `onDirty(rev)` for pushes whose `rootId` matches,
  returning whatever `api.onChanged` returns as the unsubscribe.

## Globals

None (the api object is passed in).
