# InklingLeakedToolCallParser

`core/llm-server/chat/InklingLeakedToolCallParser.js`

Recovers Inkling 2 tool calls that reached the app as text instead of as calls.

## Methods

- `InklingLeakedToolCallParser.parseAll(content)` returns every
  `<|content_invoke_tool_json|>{"name": NAME, "args": {...}}` block in the text,
  in order, as `{ tool, params }`. Only a balanced JSON object right after the
  marker counts, with a string `name` and an object under `args`. A marker
  inside an earlier call's object is that call's argument data. Returns `[]` for
  empty text. [LooseToolCallParser](bridge/parsing/LooseToolCallParser.md) calls
  it last.
- `InklingLeakedToolCallParser.trailing(reasoning)` returns the block a
  reasoning text ends on (marker and object, as text), or `''` when the text
  ends on anything else or the block cannot be read.
  [CompletionAttempt](router/CompletionAttempt.md) hands it on as the reply
  when the reply itself came back with no text and no call.
- `MARKER`: `<|content_invoke_tool_json|>`.

## Why

An Inkling 2 reply is a list of blocks, each opened by `<|message_model|>`. A
call is its own block, `<|message_model|>NAME<|content_invoke_tool_json|>{"name":NAME,"args":{...}}`,
and the server (llama.cpp's Inkling format, Basalt's `inkling2` dialect) turns
it into a native tool call. The model sometimes writes the marker and the JSON
without opening a new block. The server then sees no call and passes the text
on as part of whatever block was open. Seen on 2026-11-22 with
`Inkling-2-Mini-NVFP4-DQ8` on Basalt, on the native route:

- inside a thinking block: the reply came back empty, the app asked again and
  the model went on without the call, so an `update_plan` `done: 1` was lost;
- inside a text block: a Code mode reply ended with the raw block
  (`run_command`, `node --version`) shown to the user as its answer, the work
  not done.

Only the end of the reasoning counts: a model that stops right after writing a
call meant to make it, while a block it went on thinking past was a thought.
