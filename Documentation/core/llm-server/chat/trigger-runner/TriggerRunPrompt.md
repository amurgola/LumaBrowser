# TriggerRunPrompt

`core/llm-server/chat/trigger-runner/TriggerRunPrompt.js`

The mode system prompt of a trigger run.

## Methods

- `TriggerRunPrompt.system(trigger, kind, event, cfg, run)`: a configured
  agent's persona (`cfg.persona`) first, then
  [TriggerRunPreamble](../triggers/TriggerRunPreamble.md)`.build` (a batch event
  passes `_batchCount`; options `respondMode`, `sourceKind`, `expect`,
  `artifactRootId`, `attempt`, `previousError`), then `run.memoryBlock`, joined
  by blank lines.
- `TriggerRunPrompt.memoryBlock(trigger, triggerStore)`:
  [TriggerMemoryBlock](../triggers/TriggerMemoryBlock.md)`.build` over the
  notes and the last `runs` runs, or null when the trigger keeps no memory (or
  the store cannot be read).
