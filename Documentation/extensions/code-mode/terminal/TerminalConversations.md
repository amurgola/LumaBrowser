# TerminalConversations

`extensions/code-mode/terminal/TerminalConversations.js`

The chat-store side of a terminal session's Code-mode conversation.

## Methods (static)

- `resumeProblem(store, id)` -> `['no-conversation', 'conversation <id> not found']`,
  `['not-code', 'conversation <id> is not a Code session']`, or null.
- `resume(store, id, { cwd, origin, client, agent })` re-points the meta
  (`kind: 'project'`, `projectPath`, `origin`, `client?`, `agentId?`, other data
  kept) and returns the existing message count.
- `create(store, { cwd, origin, client, agent, modelRef })` -> the new id; title
  `<agent name or Code> · <folder>`, `toolsEnabled`, mode `code`,
  `background: true` (it was started outside the chat tab, so the sidebar lists
  it only while background conversations are shown), meta
  `{ kind: 'project', projectPath, agentId, origin, task: '', client? }`.
- `dropIfEmpty(store, id)` deletes a conversation with no messages (best effort).
