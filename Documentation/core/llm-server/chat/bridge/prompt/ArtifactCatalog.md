# ArtifactCatalog

`core/llm-server/chat/bridge/prompt/ArtifactCatalog.js`

The cross-turn artifact catalog prepended to the task, so "now edit it" can
name the right id, with the regions the user painted on each image.

## Methods (all static)

- `collect(priorMessages)`: reads `priorMessages[].toolCalls.artifacts`;
  returns `[{ id, type, title, versions? }]` in first-appearance order, one
  entry per `rootId` chain carrying the LATEST version's id, type and title
  (type defaults to `artifact`). `versions` (`[{ id, version }]`, oldest
  first) appears only for a chain with history. Rows without
  `rootId`/`version` stay distinct. `regions`
  (`[{ id, artifactId, note, coverage, current }]`) appears on a chain when
  [EditRegionIndex](EditRegionIndex.md) found a region painted on one of its
  versions; `current` marks a region from the newest user message.
- `render(catalog)`: `''` when empty, else `HEADER`, one
  `  - <type> "<title>" → id `<id>`` line per entry (with `(vN, latest;
  earlier versions: ...)`), under it one indented
  `marked region `rgn_x` on `art_y`: "note" (marked in the message you are
  answering | marked in an earlier message, about 12% of the image)` line per
  region, the `HISTORY_NOTE` when any chain has history, the `REGION_NOTE`
  (what a marked region is, pass its id as `edit_image` `regionId`, the
  current one applies by itself, `"none"` opts out) when any region is listed,
  and `]` plus a blank line.
- `HEADER`, `HISTORY_NOTE`, `REGION_NOTE`.

## Why

AgentRunner carries tool results only inside one run and the renderer strips
toolCalls from the wire history, so without this the model cannot know an id
from an earlier turn. Earlier versions are listed so a rejected edit can be
redone from the version before it, and so an unrelated new change can build on
the earliest version that already has what the user wants: instruction edit
models soften the picture a little on every pass (reliable for about five
chained edits, visibly degraded by ten in the published measurements).
