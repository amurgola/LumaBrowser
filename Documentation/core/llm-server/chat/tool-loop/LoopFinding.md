# LoopFinding

`core/llm-server/chat/tool-loop/LoopFinding.js`

What one loop check concluded about one call.

## Methods

- `new LoopFinding({ pattern, record, held, facts = {} })`: `pattern`,
  `tool` and `step` (from the record), `held` (true = the call is not run),
  `facts` (what [LoopFeedback](LoopFeedback.md) needs).

## Why

A single shape for every check's verdict, so the monitor, the feedback text
and the telemetry treat all patterns alike.
