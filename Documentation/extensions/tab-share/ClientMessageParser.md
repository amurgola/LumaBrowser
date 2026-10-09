# ClientMessageParser

`extensions/tab-share/ClientMessageParser.js`

Parses and sanitises one raw message from a tab viewer's WebSocket. This is
the boundary between an anonymous guest and the shared tab: anything
malformed, oversized or unknown is dropped (null).

## Methods

- `ClientMessageParser.parse(raw)` (string or Buffer) returns a normalised
  message or null. Accepted shapes:
  - `{ t:'mouse', k:'move'|'down'|'up', x, y, b?, cc? }`, `{ t:'click', x, y, b?, cc? }`:
    x, y clamped to 0..1 (non-numeric rejects); `b` in left/right/middle else
    left; `cc` 2 or 1.
  - `{ t:'wheel', x, y, dx, dy }`: needs a non-zero delta; each clamped to +-2000.
  - `{ t:'key', key, mods? }`: key 1 to 16 chars; mods mapped (ctrl/control,
    shift, alt, meta), unknown dropped, de-duplicated.
  - `{ t:'text', s }`: non-empty, cut to 2000 chars.
  - `{ t:'nav', a:'back'|'forward'|'reload' }`, `{ t:'ping' }`.
  - `{ t:'rtc', k:'want'|'answer'|'cand'|'up'|'down' }`: an answer needs an
    SDP of at most 48 KB; a candidate needs a `candidate` string of at most
    512 chars (`sdpMid` cut to 32, `sdpMLineIndex` integer or null).
- Limits are statics: `MAX_MSG_BYTES` (64 KB), `MAX_TEXT_CHARS`,
  `MAX_SDP_CHARS`, `MAX_KEY_CHARS`, `MAX_CANDIDATE_CHARS`, `MAX_SDP_MID_CHARS`,
  `MAX_WHEEL_DELTA`.
