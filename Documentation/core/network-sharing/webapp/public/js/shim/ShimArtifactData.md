# ShimArtifactData

`core/network-sharing/webapp/public/js/shim/ShimArtifactData.js`

The shim's live-artifact data surface (`all` / `mutate` / `onChanged`, the
desktop preload's shape, read by the chat's LiveArtifacts through
`ArtifactDataStore` with `{ kind: 'ipc', api: api.artifactData }`) over
`/sharing/artifact-data/<id>`.

## Methods

- `new ShimArtifactData({ api, win })`; `surface()`.
- `all(idOrRootId)`: the snapshot; registers its `rootId` and `rev` for polling.
- `mutate(idOrRootId, ops)`: POSTs `ops` as JSON.
- `onChanged(cb)`: returns the unsubscribe. While any listener exists a 10 s
  poll asks each watched chain `?since=<rev>`; a 204 is unchanged, a newer `rev`
  calls `cb({ rootId, rev, keys: [] })`. The last unsubscribe stops the timer and
  forgets the chains.
- `pollOnce()`: one poll pass. `ShimArtifactData.url(id, since?)`.

Errors never throw: `{ success: false, error }` (host `error`, `HTTP <status>`,
`empty response` or the network message).
