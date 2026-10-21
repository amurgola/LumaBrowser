# NativeCallStream

`core/llm-server/chat/bridge/turn/NativeCallStream.js`

The native tool-call handler for one completion: the counterpart of
[IterationStream](IterationStream.md) for a model on the native route.

## Methods

- `new NativeCallStream({ hooks, mirror }, { now })`; `onDelta(delta)` (bound):
  takes `{ index, id, name, argsDelta }` as the adapters report it. The first
  fragment of a slot suppresses the iteration on the
  [StreamMirror](StreamMirror.md) (retracting any prose already mirrored into
  the thinking pane, as the fence does) and opens a
  [PendingToolCard](PendingToolCard.md) carrying that `index`; every fragment
  then updates the card from a fence-shaped buffer
  (`{"tool": "<name>", "params": <args so far>`), so
  [ToolCallSniffer](../parsing/ToolCallSniffer.md) names the tool and its
  target without change. A missing index is slot 0; junk is ignored.
- `count`: slots opened so far.

## Why

Before this, native `tool_calls` were only known when the stream ended
(`CompletionAttempt` turns them into fences for the loop), so a gpt-oss or
remote model writing a 30-second `write_file` showed an empty bubble and then
a finished card. The fence path has had an instant card since the legacy
`emitPending`; this gives the native path the same one, per slot, because a
native reply may stream several calls at once.
