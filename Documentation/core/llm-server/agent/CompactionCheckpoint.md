# CompactionCheckpoint

`core/llm-server/agent/CompactionCheckpoint.js`

Keeps a compaction across turns. A run's history is rebuilt from the whole
stored conversation on every turn, so a conversation that has outgrown the
window was summarized again on every turn: one more model call, and a request
whose head changed, so the server re-read everything after the system prompt.
The checkpoint records which leading messages a summary was written from;
a later turn whose history starts with exactly those messages gets the same
summary in their place, byte for byte, with no model call.

## Methods

- `new CompactionCheckpoint(store, { window })`: `store` is `{ load(): entry
  | null, save(entry) }` or null (nothing is remembered); `window` is the
  run's context window in tokens; `enabled`.
- `begin(messages)`: call once the history is seeded (`[system..., ...prior
  turns, task]`) and before anything is sent. Remembers the seeded messages.
- `apply(messages, { needed = false })`: replaces the leading messages the
  stored entry covers with `{ role: 'user', content: entry.content }`, in
  place. Returns how many it replaced; 0 when there is no valid entry, the
  entry would cover the task (the last message), or the digest of those
  messages no longer matches (an edit, a regeneration, another branch). An
  entry written for a window at least as large as this run's is always used;
  one written for a smaller window (or with none on record) only when
  `needed` (the request is past the trigger here too). At most once per run.
- `record(result)`: after a compaction (`Compaction.compact`'s result, before
  it is applied). When everything summarized came from the seeded prior
  turns, saves `{ v, count, digest, content, window }`, counted in the seeded
  messages' terms even on top of a summary applied or recorded earlier in the
  run. A compaction that reaches the task or the run's own steps (or carries a
  stray system message) is not saved, and nothing after it is for this run.
  A throwing store is ignored.
- `CompactionCheckpoint.digest(messages)`: sha1 over roles and text in order.

## Entry

`{ v: 1, count, digest, content, window }`: `count` leading non-system
messages, their digest, the summary message's full text (the summary plus
anything the compaction carried, such as delivered tool manuals), and the
context window the run had.

## Why

Live trace on a 16k window (2026-11-10): from the turn the conversation
passed the window, every turn failed its first request twice with HTTP 400,
ran a summary call and re-read 8,000 to 10,000 tokens. The summary was thrown
away with the run. A larger window than the one the summary was written for
still gets the full history, unless that is past the trigger too. For the
same window the summary is always used: deciding it from each turn's size
estimate flipped the head between the full history and the summary around
the trigger (the first request of a turn is estimated at 4 characters per
token, later ones at the measured ratio), and every flip re-read the
conversation.
