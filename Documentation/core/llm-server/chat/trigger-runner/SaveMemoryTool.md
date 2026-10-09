# SaveMemoryTool

`core/llm-server/chat/trigger-runner/SaveMemoryTool.js`

The `save_memory` tool of a trigger with persistent memory
([TriggerMemoryPolicy](../trigger-store/TriggerMemoryPolicy.md)): replaces the
notes the trigger keeps across runs.

## Methods

- `new SaveMemoryTool({ triggerStore, triggerId, maxChars, onSaved? })`.
- `definition()`: `{ name: 'save_memory', description, inputSchema: { notes },
  handler }`. The handler calls `triggerStore.setMemory(triggerId, notes)`
  (capped by the policy), then `onSaved()`, and returns `{ success: true,
  chars, truncated }` where `truncated` says the kept notes are shorter than
  what was sent.
