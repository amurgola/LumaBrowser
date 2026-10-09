# FastReaction

`extensions/roleplay-mode/pipeline/FastReaction.js`

Ships a pure-CPU composite when every needed asset is cached.

## Methods

- `FastReaction.tryRender({ data, content, directorShot, sig, turn })` true when
  it emitted an image (`plateKind: 'composite-cached'`).
