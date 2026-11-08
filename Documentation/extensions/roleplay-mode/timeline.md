# timeline

`extensions/roleplay-mode/timeline.js`

The roleplay story as a time series over the conversation's message tree. UMD:
`window.RP_TIMELINE` on the chat page (served from
`/llm-ui/ext/roleplay-mode/timeline.js`, declared in `chatUi.assets`) and
`require('../timeline')` in the main process, so both sides run one
implementation.

## Shape (`meta.data`)

- `timeline = { v: 1, base, entries, vault }`.
  - `base`: the snapshot before any reply (the setup state; for a conversation
    older than the timeline, its state when the timeline was added).
  - `entries[assistantMessageId] = { at, turn, state, activity }`: the snapshot
    after that reply, and the reply's activity record (`{ status, steps,
    changes, at }`, see [TurnActivity](pipeline/TurnActivity.md)).
  - `vault = { characters: { id: assets }, scenes: { id: assets } }`: the image
    assets of rows that are not in the head.
- `headId`: the reply whose point the top-level fields show, or `null` (base).
- A snapshot is `{ characters, scenes, activeSceneId, currentState, story,
  lastRender }` with the image fields (`CHAR_ASSETS`: `art`, `figure`,
  `avatar`, `outfits`; `SCENE_ASSETS`: `bg`) left out. Assets are global: a head
  row carries its own, and a row leaving the head parks them in the vault, so
  no image is stored twice.

## Functions

- `snapshot(data)`, `ensure(data)` (adds a timeline with the head as base;
  true when added), `reset(data)` (starts over from the head).
- `commit(data, messageId, { activity }?)`: records the head as that reply's
  point (or as the base for `null`) and makes it the head; an earlier activity
  record is kept unless one is given.
- `resolve(data, pathIds)` `{ headId, state }`: the newest point on the path,
  else the base. `entry(data, messageId)`.
- `materialize(data, pathIds)`: the head becomes the state at the end of the
  path (root first): rows from the point, assets moved between rows and vault,
  `lastShot` from the newest reaction image on the path, `lastRender` only when
  its reply is on the path, ledger rows and chronicle beats of replies off the
  path dropped. Returns true when the head changed.
- `forget(data, messageId)`: drops a removed reply's point.
- `syncDefinitions(data, prev)`: a setup edit reaches every point: each head
  character's `name`, `description`, `appearance`, `profile`, `seed` and each
  scene's `name`, `description`; rows the edit added join every point (absent,
  blank chronicle); rows it deleted leave every point and the vault.
- `mergeForSave(latest, ours, { ownId, activeIds, liveIds })`: what a server
  reaction stores: the stored data with the reaction's own point, image,
  `pendingArtAudit` and `assetRetry` folded in, assets merged (the reaction's
  renders win per key, wardrobes and cached pose figures are unions), points of
  deleted messages pruned, and the head re-derived for the active path.
- `adoptHead(data, payload)`: the page takes a `mode:world` announcement (head
  rows, story, `headId`, `timelineEntry`), parking the assets of rows that leave.
- `continuationIds(messages)`: the ids a new reply continues from, everything
  before the newest user message (a regenerate's old reply still trails the
  path when the turn is prepared).
- `changes(before, after)`: up to 24 `{ kind, text }` lines: cast, place,
  ledger events, presence, mood, outfit, condition, bond, reveal, profile,
  clock, threads, memory, pressure.

## Why

The story used to be one mutable blob: a regenerate built on the replaced
reply's changes (and doubled its turn counter, clock and threads), a variant
switch kept whatever ran last, and a deleted reply only lost its ledger rows
and beats. Points keyed by reply id make each branch's state its own.
