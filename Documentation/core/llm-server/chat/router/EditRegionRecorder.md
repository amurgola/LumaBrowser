# EditRegionRecorder

`core/llm-server/chat/router/EditRegionRecorder.js`

Records the edit regions a user painted (a mask over one image plus a note) on
the user row of the turn they were sent with, keyed to the image's artifact id,
so the agent's catalog can offer them and `edit_image` can use them.

## Methods

- `new EditRegionRecorder({ chatStore })` (`updateMessage`).
- `record({ attachments, images, artifacts, userRow })`: writes
  `toolCalls: { artifacts, editRegions }` on the user row (the column is
  replaced whole, so the artifacts ride along) and returns the public rows (no
  mask); `[]` when nothing valid, no row, or the store throws.
- `EditRegionRecorder.collect(attachments, images, artifacts)`: the rows with
  masks. A `{ kind: 'region', artifactId, title, ... }` entry names an image
  already in the conversation; an image attachment carrying `region` is matched
  to the artifact it became (by position, else by title when a create failed).
- `EditRegionRecorder.fromStaged(entry, artifactId, title)`: one validated row
  `{ id ('rgn_...'), artifactId, title, note, mask, coverage, width, height }`,
  or null: the mask must be a base64 PNG (a data URL is unwrapped) under
  `MAX_MASK_CHARS`, the artifact id a non-empty string, width and height
  positive integers; the note and title are whitespace-collapsed and capped;
  coverage is clamped to 0..1 or null.
- `EditRegionRecorder.publicRow(row)`.

## Why

The mask lives on the message, not on the artifact: a region is something the
user said in one turn about one image, and [EditRegionIndex](../bridge/prompt/EditRegionIndex.md)
reads it from the same `priorMessages` the catalog already walks, so no new
store or lookup is needed.
