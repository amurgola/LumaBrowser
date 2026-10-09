# HarmonyModel

`core/llm-server/chat/HarmonyModel.js`

Recognises models that speak OpenAI's harmony response format (gpt-oss).

## Methods

- `HarmonyModel.matches(modelRef)` is true when the ref matches
  `HarmonyModel.PATTERN` (`/gpt-?oss|harmony/i`). Nullish refs are false.

## Why

Harmony models split a turn across channels: `analysis` (reasoning),
`commentary` (tool calls addressed `to=functions.NAME`) and `final` (the answer).
A harmony-aware llama.cpp surfaces `analysis` on `delta.reasoning_content` and a
`commentary` tool call as native `delta.tool_calls`, with `delta.content` empty.
The agent speaks a text protocol (a ```tool fence in the content), so for these
models the router synthesizes fences with [HarmonyToolFence](HarmonyToolFence.md)
and the bridge keeps native tools on. Everything is gated on this check so
non-harmony paths stay byte-for-byte unchanged.

The pattern is deliberately broad so future harmony-trained open weights match.
