# ShimArtifacts

`core/network-sharing/webapp/public/js/shim/ShimArtifacts.js`

The shim's `artifact` surface.

## Methods

- `new ShimArtifacts({ api, store, win })`; `surface()` returns `{ get, open, delete }`.
- `get(id)`: the device copy, else fetched from the host and cached;
  `{ success: true, artifact: { id, content, language, title, type } }` or
  `{ success: false, error: 'artifact not found' }`.
- `open(id)`: writes `ShimArtifacts.documentFor(artifact)` into `win.open()`:
  an `<img>` of the base64 data for images, the content itself otherwise (as legacy).
- `delete(id)`: drops the device copy.
