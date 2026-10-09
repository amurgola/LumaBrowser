# TriggerModeServices

`core/llm-server/chat/trigger-mode/TriggerModeServices.js`

The trigger mode's late-bound collaborators, each read through a getter that may
be missing, return null or throw (all read as null).

## Methods

- `new TriggerModeServices({ getRunner?, getFileWatch?, getPageSource?, getSecrets?,
  getArtifactStore?, getChatStore?, getHookBaseUrls?, getAgentManager?,
  getNotificationSource? })`.
- `runner()`, `pageSource()`, `artifactStore()`, `notificationSource()`,
  `hookBaseUrls()`: the collaborator or `null`.
- `listAgents()`: the Agent Manager's `listAgents()` array or `null`.
- `resolveAgentId(raw)`: `{ skip: true }` for `undefined`, `{ agentId: null }`
  for a blank string (clear), `{ agentId }` matched by id then by name
  (case-insensitive), or `{ error }` (`no configured agents are available (Agent
  Manager is off)` / `no configured agent "<id>"; available: <ids>`).
- `secretStatus(trigger)`: for webhooks `{ required, set, note? }` (the note
  says a required secret is missing), else `null`. Never the secret itself.
- `validateDir(dir)`: the file-watch manager's `validateDir` when it is up,
  else `WatchFolder.validate(dir)`. Throws with a message for the model.
- `runToolGroups(conversationId)`: the runner's `describeRunTools` or `null`.
- `syncConversationTitle(conversationId, title)`: renames the conversation,
  best-effort.

## Why

The trigger store exists at boot, but the runner, file-watch manager, Page
Watcher, agent manager and tab manager come up later or not at all. A missing
collaborator degrades one feature (no agent list, no monitors) instead of
failing the setup turn. Unknown agent ids are refused so a typo never strands
every run.
