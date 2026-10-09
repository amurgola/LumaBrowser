# TurnFrames

`cli/lib/tui/session/TurnFrames.js`

Applies the bridge's host frames to the [App](App.md)'s transcript.

## Methods

- `new TurnFrames(app)`.
- `handle(type, payload)`:
  - `meta` (conversation id), `status` (status copy; a mid-turn `compacted` adds a note and goes back to
    working), `delta` (through the rollback buffer), `reasoning-delta` (a [ReasoningBlock](../blocks/ReasoningBlock.md)),
    `rollback` (held text first, then the shown answer);
  - `tool`: `pending` (status says what the model is writing), `run` (seals answer and thinking, a new
    [ToolBlock](../blocks/ToolBlock.md), carrying an `allowed for this run` decision), `done`/`result`
    (finishes the open card of that tool, else the first open one), `cancel`, `approval` (the prompt),
    `approval-done` (a reject or timeout adds a muted denied card);
  - `command:output` (to the newest open command card), `agent` (an [AgentBlock](../blocks/AgentBlock.md)
    and its progress), `artifact`, `queued`, `followup-start` (begins the queued turn), `busy`,
    `bridge-error`, `suggest` (fills the editor's suggestion between turns);
  - `done` (finishes open cards, adds the [SummaryBlock](../blocks/SummaryBlock.md), exit code 2 when
    aborted) and `error` (open cards fail as interrupted, an error block, exit code 1) end the turn.
- `appendAnswer(text)`: text the rollback buffer released, appended to the current answer block.
- `sealAnswer()`, `sealReasoning()`.
