# WorkspaceClient

`core/llm-server/ui/js/code/WorkspaceClient.js`

Calls `api.chat.workspace.<name>({ conversationId, ...args })` (the root-jailed
workspace IPC); a missing surface or a throw becomes `{ success: false, error }`.

## Methods

- fields `api`, `conversationId`; `call(name, args)`.
