# PromptBenchTranscript

`tools/prompt-bench/PromptBenchTranscript.js`

Turns what one chat turn left behind into the transcript [Scorer](../../core/llm-server/eval/Scorer.md) grades.

## Methods

- `PromptBenchTranscript.from({ events, assistant, error, durationMs })` returns
  `{ toolCalls: [{ tool, params, success }], finalResponse, error, iterations, durationMs }`.
  - `events` are the turn's chat events. A `tool` event with `phase: 'run'` opens a call; the next `phase: 'done'`
    event for the same tool settles it (`success` unless the event says `success: false` or carries an `error`). A
    call never settled counts as failed.
  - `assistant` is the stored assistant message (`content` is the final answer). `error` is a thrown turn's message
    and wins over the stored message's own `error`.
  - `iterations` is the number of tool calls plus one, the final answer.
