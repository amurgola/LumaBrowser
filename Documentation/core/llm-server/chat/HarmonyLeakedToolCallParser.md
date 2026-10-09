# HarmonyLeakedToolCallParser

`core/llm-server/chat/HarmonyLeakedToolCallParser.js`

Last-resort recovery of harmony tool calls that leaked into the content text.

## Methods

- `HarmonyLeakedToolCallParser.parseAll(content, extractBalancedObject)` returns
  every `to=functions.NAME {json}` (the `functions.` prefix is optional) call in
  order, as `{ tool, params }`. `extractBalancedObject(text, braceIndex)` must
  return the balanced object text or `null`; the agent passes its own
  (`core/shared/llm/BalancedJson.extractObject` in the new tree). An object that
  is already `{ tool, params }` passes through; otherwise the object is the
  arguments. Returns `[]` for empty content or a missing extractor.

## Why

When the server does not strip harmony channel markers, a `commentary` call can
arrive as text instead of native `tool_calls`. Only a balanced JSON object that
follows the recipient counts, so prose like "navigate to=the homepage" cannot
false-trigger a call.

An object that starts inside an earlier call's object is that call's argument
data (a call literal nested in a string), not its own call; this is the same
containment guard the fence parser uses.
