# SetupTabActions

`core/llm-server/ipc/SetupTabActions.js`

Extension-contributed Setup tabs over [SetupTabRegistry](../chat/SetupTabRegistry.md).

## Methods

- `new SetupTabActions(registry = SetupTabRegistry.shared)`.
- `list()` `{ tabs }`.
- `invoke({ extId, action, payload })` resolves `{ result }` from the extension's
  handler, or `{ success: false, error: 'extId and action are required' }`.

## Why

IPC rather than `/api`, so an API-key requirement never blocks the Setup renderer.
