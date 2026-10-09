# AgentKnowledgeGrant

`extensions/agent-manager/AgentKnowledgeGrant.js`

Knowledge-base wiring for one agent turn, shared by delegation
([AgentRuntime](AgentRuntime.md)) and the chat mode ([AgentChatMode](AgentChatMode.md)).

## Methods (static)

- `forTurn(agent, ragService)` -> `{ kbScope, allowedTools, modeSystemPrompt }`:
  the scope is always `agent:<id>`; when the scope has documents,
  `search_knowledge_base` joins the allow-list (once) and a note naming the
  documents ("Before answering anything these documents might cover, call
  search_knowledge_base ...") is appended to the persona. A failing service
  reads as no documents.
