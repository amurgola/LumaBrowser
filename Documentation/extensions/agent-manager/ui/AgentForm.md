# AgentForm

`extensions/agent-manager/ui/AgentForm.js`

## Methods

- `AgentForm.render({ agent, models, defaultRef, toolGroups, modelLabel }, on)`:
  "Edit agent"/"New agent"; name, description, system prompt; model select
  ("App default (<default label>)" then each model); the grouped tool picker
  ("No tools available. The agent will be LLM-only." when none); the
  knowledge-base host `.am-kb`; Cancel and Save/Create agent.
- `AgentForm.collect(form)`: `{ patch: { name (trimmed), description
  (trimmed), systemPrompt, modelRef (empty -> null), tools } }` or
  `{ error: 'Name is required.' }`.
