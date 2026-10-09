# SharedAgents

`core/network-sharing/host/SharedAgents.js`

The host's custom agents (agent-manager extension) as offered to shared chat
clients. The `shareAgents` toggle closes every surface together and is read
per request.

## Methods

- `new SharedAgents(service, { modeRegistry = ChatModeRegistry.shared })`:
  `service` provides `getShareFlags` and `getAgentManager`.
- `isShared()`: `shareAgents !== false`; a throwing flag read counts as shared.
- `list()`: the manager's `listAgents()`, or `[]` when not shared, inactive or failing.
- `chatUi()`: `{ path }` of the manager's `chatUiPath`, else `{ status: 403,
  message: 'Custom agents are not shared' }` or `{ status: 404, message: 'Not available' }`.
- `chatUiAsset(name)`: `{ path }` of `<bundle dir>/ui/<name>` when `name` is a
  plain `*.js` file name and the extension's `manifest.js` (next to the bundle)
  lists it in `chatUi.assets`; else the `chatUi()` refusal or `{ status: 404,
  message: 'Not available' }`. These are the modules the agent-chat bundle
  imports when the web client loads it as a module.
- `webModes()`: registered modes in `WEB_CHAT_MODE_IDS` (only `agent-chat`),
  withheld while not shared, each with `chatUiUrl: '/sharing/agents/chat-ui.js'`.
- `resolveTurn(agentId)`: `{ turn }` from `buildTurn(String(agentId))`, else
  `{ refusal }`: 403 `custom agents are not shared` or 404 `agent not found on
  host` (also when `buildTurn` throws), body `{ error: { message } }`.

## Why

Agents carry a persona, tool grants and a private knowledge base, so a host may
share its model without them. Roleplay and code modes depend on surfaces the
browser client lacks, hence the one-mode whitelist. An unknown agent is never
a silent fallback to plain chat.

## Change requests

`chatUiAsset` reads the extension's manifest because the agent-manager public
surface (`global.__lumaAgentManager`) only carries `chatUiPath`. If that surface
gains `chatUiAssets` (absolute paths), use it instead.
