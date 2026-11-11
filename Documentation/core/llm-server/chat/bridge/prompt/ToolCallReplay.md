# ToolCallReplay

`core/llm-server/chat/bridge/prompt/ToolCallReplay.js`

Puts the tool calls of earlier turns back into the history a turn is sent
with.

## Methods (all static)

- `expand(prior, rows)`: for each assistant message of `prior` whose text
  equals the next stored active assistant row's `content` (rows consumed in
  order), inserts that row's calls before it. Returns `prior` itself when
  nothing was inserted.
- `messagesFor(row)`: the `[assistant fence, user result]` pairs for the
  row's `toolCalls.tools`, oldest first, at most `MAX_CALLS_PER_TURN` (the
  newest; the first result line says how many came before). Entries without
  params (a synthetic parse failure) and `activate_tools` are left out.
- `fence(call)`: the ```` ```tool ```` fence around `{ tool, params }`, strings
  over `MAX_STRING_CHARS` cut to their head and marked; a call still over
  `MAX_CALL_CHARS` is clipped again at `TIGHT_STRING_CHARS`.
- `result(call, skipped)`: `[Tool Result for <tool>]: ` then `Done.` and the
  trace's summary, `Error: ...`, or "Not finished" for a call the turn was
  stopped in, then `RESULT_NOTE`.

## Why

The stored answer of a turn is its final text only. Sent as native
role-separated turns, the history then showed the assistant answering "Here
is your image" with no call before it, turn after turn, and after a few such
turns the model copied what it saw: it announced work and told the user to go
look without calling anything. Before native history the same text sat inside
one flattened transcript in the task, which a model imitates far less.

The replay uses the loop's own forms (the fence the model writes, the
`[Tool Result for ...]` line the loop files as a user message), so an earlier
turn reads like the current one will. Payloads are clipped because a
generated document must not be re-sent on every turn; the mark says the value
was longer, so the clipped text is not taken for what a call should contain.
