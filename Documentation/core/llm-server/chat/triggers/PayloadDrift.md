# PayloadDrift

`core/llm-server/chat/triggers/PayloadDrift.js`

Detects whether a live trigger event still has the structural shape of the
sample the trigger was tested against.

## Methods

- `PayloadDrift.shapeOf(event, kind = 'webhook')` returns
  `{ contentType, keys: { path: type } }` or `null`:
  - webhook: `body` walked two levels deep (`body.user`, `body.user.id`), at most
    `MAX_KEYS` (80) paths; a non-object body is `{ body: <type> }`; else
    `{ bodyText: 'string' }`. `contentType` is the media type without parameters.
  - file: `{ ext: <the extension>, isText: <type of isText> }`.
  - page: `null` (nothing comparable).
- `PayloadDrift.diffShape(sampleShape, liveShape)` returns `{ drifted, missing,
  typeChanged: [{ path, from, to }], added, contentTypeChanged: null | { from, to },
  sig }`, or `null` when either shape is missing.
- `PayloadDrift.driftOf(sample, event, kind)` is `diffShape(shapeOf(sample),
  shapeOf(event))`.
- `PayloadDrift.describe(diff)` is a one-line human summary, `''` when not drifted.

## Why

Senders rename fields, nest them, turn a number into a string or change casing.
The standing instruction then reads the wrong path and the run "succeeds" with
garbage. Comparing fingerprints catches that before the user does; the runner
still runs the event but records, logs and notifies once per distinct `sig`.

Drift is a sample path missing from the event, a changed type, or a changed
content type. Added paths are reported (at most 20) but are harmless. A `null`
on either side is not a type change, because senders null out optional fields.
A missing or re-typed parent implies its children, so only the top-most missing
paths are reported (`body.user` became a string, so not also `body.user.id`).

Behaviour note: for file triggers, `isText` is fingerprinted by type, so a text
file replaced by a binary one (true to false) is not drift; only the extension
is compared by value. That is legacy behaviour, kept as is.
