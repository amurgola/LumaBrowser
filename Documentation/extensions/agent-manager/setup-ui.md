# setup-ui.js (agent-manager entry)

`extensions/agent-manager/setup-ui.js`, `extensions/agent-manager/setup-ui.css`

The "Agents" Setup-tab entry, loaded as a module: registers
`{ id: 'agent-manager', label: 'Agents', mount }` with `window.LumaSetupExt`,
mounting [AgentsTab](ui/AgentsTab.md); logs "[agent-manager] LumaSetupExt not
present" without the host. `setupTab.assets` lists the `ui/` modules.
`setup-ui.css` is unchanged apart from em-dashes in comments.
