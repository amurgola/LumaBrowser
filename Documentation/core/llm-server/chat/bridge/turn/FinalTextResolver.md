# FinalTextResolver

`core/llm-server/chat/bridge/turn/FinalTextResolver.js`

Decides the visible final answer of a finished run.

## Methods (all static)

- `resolve({ result, trace, artifacts, groups, hooks })`: the final response
  or the [FallbackMessage](FallbackMessage.md). With no trace entries and text
  that looks like a call: loads the intended tool's group (persisted), records
  a failed step (`run`/`done` cards, `Parse failed`) and returns a plain
  recovery message with the emitted text (up to 800 characters) in a
  4-backtick fence. Otherwise strips leaked calls
  ([ToolFenceStripper](../parsing/ToolFenceStripper.md)); when anything was
  removed, records a failed follow-up and returns the stripped text, or
  `DONE_WITH_FAILED_TWEAK` when only artifacts remain, or the fallback.
