# WorkspaceRootResolver

`core/llm-server/chat/workspace/WorkspaceRootResolver.js`

Finds the one folder a conversation works in.

## Methods

- `new WorkspaceRootResolver({ chatRouter, modeRegistry = ChatModeRegistry.shared })`.
- `resolve(conversationId)`: `{ root, label, mode }` or `null`. `root` is
  absolute; `label` is the mode's label or the folder's base name.

## Order

1. The conversation's chat mode may declare a `workspaceRoot({ conversationId,
   meta })` hook returning a path string or `{ root, label }`.
   ```js
   chat.registerMode({
     id: 'game',
     workspaceRoot({ conversationId }) { return gameDirFor(conversationId); },
   });
   ```
2. Otherwise `meta.data.projectPath`, which Code mode's "Work on a project
   folder" setup writes, so that mode needs no hook.

The answer counts only if it is an existing directory. A mode hook that throws,
a store that throws, an empty answer or a missing folder all mean "no folder"
(an empty hook answer falls through to `projectPath`).
