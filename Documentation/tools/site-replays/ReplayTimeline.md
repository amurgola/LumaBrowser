# ReplayTimeline

`tools/site-replays/ReplayTimeline.js`

Builds a replay timeline of terminal-bridge frames, `[waitMsBefore, type, payload]`, paced like a local model
(`TOKENS_PER_SEC` 70, `CHARS_PER_TOKEN` 4.2). Used by [DevReplayScenario](DevReplayScenario.md).

## Methods

- `ReplayTimeline.msFor(text)`: how long the model takes to write `text`.
- `add(wait, type, payload)`, `stream(type, text)` (one frame per word with its trailing space),
  `tool(name, params, target, summary, took)` (pending, pending with `chars`, run, done),
  `command(cmd, lines, summary, success)` (pending, run, one `command:output` per line, done); all chain.
- `entries()`: a copy of the timeline.
