# AgentDirectory

`extensions/agent-manager/ui/AgentDirectory.js`

## Methods

- `AgentDirectory.list(api)`: `api.setup.invoke('agent-manager', 'list')`
  on the desktop chat page (auth-free bridge), else
  `window.LumaAPI.listAgents()` on the web PWA; `[]` on any failure. Never
  `/api`, which can sit behind an API key.

## Globals

Reads `window.LumaAPI`.
