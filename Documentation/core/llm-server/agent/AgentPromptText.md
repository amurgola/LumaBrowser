# AgentPromptText

`core/llm-server/agent/AgentPromptText.js`

The live pieces the agent's system prompt is built from. Data only.

## Members

- `AgentPromptText.browserToolLines(tabId)`: the
  `- name: description. Params: {...}` lines for the built-in browser tools,
  with the working tab id interpolated. Kept verbatim: local models will not
  infer these rules.
