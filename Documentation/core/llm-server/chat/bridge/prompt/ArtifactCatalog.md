# ArtifactCatalog

`core/llm-server/chat/bridge/prompt/ArtifactCatalog.js`

The cross-turn artifact catalog prepended to the task, so "now edit it" can
name the right id.

## Methods (all static)

- `collect(priorMessages)`: reads `priorMessages[].toolCalls.artifacts`;
  returns `[{ id, type, title, versions? }]` in first-appearance order, one
  entry per `rootId` chain carrying the LATEST version's id, type and title
  (type defaults to `artifact`). `versions` (`[{ id, version }]`, oldest
  first) appears only for a chain with history. Rows without
  `rootId`/`version` stay distinct.
- `render(catalog)`: `''` when empty, else `HEADER`, one
  `  - <type> "<title>" → id `<id>`` line per entry (with `(vN, latest;
  earlier versions: ...)`), the `HISTORY_NOTE` when any chain has history,
  and `]` plus a blank line.
- `HEADER`, `HISTORY_NOTE`.

## Why

AgentRunner carries tool results only inside one run and the renderer strips
toolCalls from the wire history, so without this the model cannot know an id
from an earlier turn. Earlier versions are listed so a rejected edit can be
redone from the version before it.
