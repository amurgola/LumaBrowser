# TranscriptHealth

`core/llm-server/eval/TranscriptHealth.js`

Harvests cross-cutting health signals from agent transcripts, regardless of what a task asserted.

## Methods

- `TranscriptHealth.harvest(transcripts)` returns
  `{ repetitionAborted, offFormatCalls, emptyReplies, timedOut, errors, turns,
  lengthCutCompletions, missingArgCalls, overflowRecoveries, offFormatShapes }`.
  Null entries are skipped. `offFormatShapes` sums per-shape counts (for example
  `{ 'xml-tool_call': 2, 'bare-json': 1 }`).
- An empty reply is `health.emptyReply`, or a turn with no prose, no tool call and no error.

## Why

These are the ways a local model fails a turn that no `expect` block would think to write
down. The repetition abort motivated the gambit: a sampler regression turned zero of these
into one per conversation and nothing noticed. They are returned, not scored, so the gambit
report rolls them into a health group and a loop shows as both a health failure and as
whatever task damage it caused. Shapes are kept because "all XML" and "bare JSON" call for
opposite fixes.
