# ModeTurnMessages

`core/llm-server/chat/router/ModeTurnMessages.js`

Shapes one turn's messages from what a chat mode's `buildTurn` returned.

## Methods

- `ModeTurnMessages.apply(turn, messages, { prependSystem = true })` returns the
  messages to run. In order: the mode's `turn.messages` replace the page's thread
  when they are a non-empty list of role-bearing messages, no longer than the
  thread, ending on the same newest message (same role and content); then
  `turn.postHistoryPrompt` (trimmed, capped at `MAX_POST_HISTORY_CHARS` 4000) is
  folded into the newest user message (`\n\n` plus the text, or an appended text
  part on a multimodal message), or trails as a `system` message when the thread
  does not end on a user turn; then, with `prependSystem`, `turn.systemPrompt`
  goes first as a `system` message. No turn, or nothing to add, returns the
  messages unchanged.

## Why

A mode that keeps its own memory (roleplay) needs two things the single system
prompt could not give it: a say over which raw turns run (its summary stands in
for the rest) and an instruction after the history, where current models weigh
it most. Folding into the user turn keeps every chat template happy; the
suffix check means a mode can never drop the message it is answering.
