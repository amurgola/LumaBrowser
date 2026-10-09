# AgentSetupInvoke

`extensions/agent-manager/AgentSetupInvoke.js`

Controller for the Agents tab's `setup.invoke` (auth-free IPC, so an API-key
requirement never blocks the in-app tab).

## Actions

`list` -> `{ agents (with kbDocs) }`; `create` -> `{ agent }`; `update { id, patch }`
-> `{ agent }`; `delete { id }` -> `{ removed }`; `tools` -> `{ groups }`;
`export { id }`, `import` ([AgentFileDialogs](AgentFileDialogs.md));
`kb.list { agentId }` -> `{ documents }`; `kb.add { agentId }`;
`kb.remove { agentId, docId }` -> `{ documents }`. Unknown: `Unknown action: <a>`.
Agent lookups accept an id or a name and throw `Agent not found`.
