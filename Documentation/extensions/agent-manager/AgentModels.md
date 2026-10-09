# AgentModels

`extensions/agent-manager/AgentModels.js`

Whether a model ref is installed in this app.

## Methods (static)

- `isInstalled(modelRef, router = ExtensionGlobals.chatRouter())` -> true when
  `router.listModels().models` has that ref; false without a router or list, or on throw.
