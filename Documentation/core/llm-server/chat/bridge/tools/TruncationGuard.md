# TruncationGuard

`core/llm-server/chat/bridge/tools/TruncationGuard.js`

The outermost check on a tool call.

## Methods

- `new TruncationGuard({ pipeline, parser, toolSet, router })`.
- `execute(name, params, browserService)`: lost arguments ->
  `argumentsUnreadable`; cut arguments -> `argumentsCutOff`; repaired (the
  params marker or the parser's last-call flag, which is always consumed) and
  `ApprovalGate.requiresApproval(name, toolSet.mutatingDeclared)` ->
  `refusedTruncatedCall`. Otherwise holds the chat server's idle unload
  (`router.llmServerService.runtimeServer.holdIdle()`) around
  `pipeline.execute`, and adds the truncation warning to a repaired read.

## Why

A repaired write would overwrite the target with a fragment (a severed
write_file reported success at 598 bytes); a repaired read is only a wasted
lookup. The idle hold covers tools that outlast the unload window.
