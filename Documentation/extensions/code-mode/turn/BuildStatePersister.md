# BuildStatePersister

`extensions/code-mode/turn/BuildStatePersister.js`

The Code mode's after-turn reaction (`postProcess`).

## Methods

- `new BuildStatePersister({ context, sessions })`.
- `run({ conversationId, meta, emit, setMeta, aborted })`:
  - aborted with a workspace that is not `installed`: `context.code.discardWorkspace`,
    forget the session, persist `data.build = null`, emit `build:state` null;
  - otherwise, when the session has a snapshot ([SessionSnapshot](../SessionSnapshot.md)),
    persist it as `data.build` (other meta data kept) and emit `build:state`;
  - no session: nothing. `setMeta` and `emit` failures are swallowed.

## Why

A stopped build left in the user extensions dir would be loaded by the next
boot. The persisted snapshot lets the playground and the Code tab survive reload.
