# AgentFileDialogs

`extensions/agent-manager/AgentFileDialogs.js`

The native file dialogs of the in-app Agents tab (Electron required lazily).

## Methods

- `new AgentFileDialogs(manager, dialog = null)`.
- `exportToFile(agent)` -> `{ canceled: true }` or `{ canceled: false, filePath, documents }`;
  default file name `<name>.agent.json` with unsafe characters replaced.
- `importFromFile()` -> `{ canceled: true }` or `{ canceled: false, agent, warnings, kb }`;
  an unreadable file throws `Could not read that file as an agent export: ...`.
- `addKnowledge(agent)` (requires the RAG service first) picks pdf, txt, md,
  markdown, html or htm files and ingests them into the agent's scope ->
  `{ canceled, results, documents }`.
