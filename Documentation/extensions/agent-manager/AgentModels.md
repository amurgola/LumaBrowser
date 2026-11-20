# AgentModels

`extensions/agent-manager/AgentModels.js`

Whether a model ref is installed in this app.

## Methods (static)

- `isInstalled(modelRef, router = ExtensionGlobals.chatRouter())` -> true when
  `router.listModels().models` has that ref; false without a router or list, or on throw.
- `isGone(modelRef, router = ExtensionGlobals.chatRouter())` -> true only when the list was read
  and lacks the ref; a list that cannot be read says nothing. [AgentRuntime](AgentRuntime.md) uses it
  to fall back to the app default.
- `missing(agents, router = ExtensionGlobals.chatRouter())` -> `[{ id, name, modelRef }]`, the agents
  pinned to a model the list no longer has. An agent on the app default is never one, and
  while the list cannot be read (no router yet, a failed lookup) the answer is `[]`: unknown
  is not gone. The boot preflight alerts on these (2026-11-18).
