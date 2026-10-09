# ResponseInputTranslator

`core/llm-server/server/responses/ResponseInputTranslator.js`

Translates a Responses `input` into chat-completions messages.

## Methods

- `translate(input)` returns `{ system: [text], messages }`:
  - a string is one user message;
  - `message` items: `system`/`developer` text goes to `system`, `assistant`
    text into the current model turn, anything else a `user` message;
  - `reasoning` (its `reasoning_text` content, else summary) becomes the turn's
    `reasoning_content`; reasoning after a finished turn opens the next;
  - `function_call`, `custom_tool_call` (arguments `{"input": ...}`) and
    `local_shell_call` (name `local_shell`, the action as arguments) become
    `tool_calls` of the turn;
  - `function_call_output` / `custom_tool_call_output` become `tool` messages;
  - other items (`item_reference`, `web_search_call`...) are skipped.
  A turn is one assistant message (text, `tool_calls`, `reasoning_content`); a
  turn with only reasoning is dropped.

## Why

Responses spreads one model turn over several items; chat templates want one
assistant message whose tool calls are directly followed by their results.
