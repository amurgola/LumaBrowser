# CatchUpPlan

`core/llm-server/chat/triggers/file/CatchUpPlan.js`

Decides what a restarting [FileWatch](FileWatch.md) replays.

## Methods

- `CatchUpPlan.build(previous, current, events)`: `previous` and `current` are
  `Map(relPath -> [mtimeMs, size])`. Returns `{ fire: [{ rel, kind, sig }],
  dropped }`: files new in `current` are `add`, files whose signature changed
  are `change`, files only in `previous` are `remove` (`sig: null`); only kinds
  in `events` are kept; sorted by mtime (removals first); at most `MAX_FIRES`
  (50) fire and the rest are counted as dropped.
- `CatchUpPlan.sameSignature(a, b)`: both present with equal mtime and size.

## Why

A folder that received a backlog while the app was closed must not start an
unbounded number of agent runs at once.
