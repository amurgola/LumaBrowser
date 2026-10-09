# AgentBundle

`extensions/agent-manager/AgentBundle.js`

One agent as a portable `luma-agent` JSON bundle.

## Methods

- `new AgentBundle(manager)`.
- `export(agent)` -> `{ format: 'luma-agent', version: 1, exportedAt, agent: { name, description, systemPrompt, tools, modelRef }, knowledgeBase: { documents } }`.
- `import(bundle)` -> `{ agent (with kbDocs), warnings, kb }`. Throws
  `Not a Luma agent export file` for anything else. Lenient: the name gets the
  next free `" (n)"` suffix (with a warning); tools this install lacks and a
  missing model stay on the record with warnings; KB documents replay through
  [KnowledgeBaseTransfer](KnowledgeBaseTransfer.md), or a warning when the
  service is absent. A nameless agent imports as `Imported agent`.
