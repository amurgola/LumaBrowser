# SentForm

`core/llm-server/chat/bridge/prompt/SentForm.js`

What a stored user turn is replayed as on later turns of the conversation.

## Methods (all static)

- `durable(row)`: the row's `content`, preceded by the tool manuals its
  `sentContent` carried (and a blank line) when it delivered any.
- `manualsOf(sent, text)`: the manual block inside a sent text, from
  [ManualDelivery](ManualDelivery.md)'s `HEADER` up to the turn's own text
  (searched from the end: a manual may quote a short message); `''` when the
  text carried none. A block that cannot be told apart from what follows it
  comes back whole.

## Why

A turn is sent with more than the user's text: the artifact catalog, manuals
delivered that turn, a chat mode's post-history prompt (roleplay's scene
notes), the clock and the format reminder. Only the manuals are history; the
rest is written for that one reply. Replaying the whole sent text on every
earlier user turn made each of them carry its own stale copy of those blocks,
so the request grew by a full set per turn (a 1,500-character post-history
prompt cost 14,000 extra characters by turn eight), none of it counted by
compaction or by a mode's own history trim.

Dropping the tail means the previous user message no longer matches the
server's KV cache from where its tail began, so each turn re-reads the
previous reply; everything before it stays cached.
