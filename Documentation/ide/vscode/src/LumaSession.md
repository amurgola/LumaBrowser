# LumaSession

`ide/vscode/src/LumaSession.js`

One workspace's conversation with the Code agent over the terminal bridge, the same wire as the JetBrains plugin's
LumaSession.kt: discover (and start) the app, open the bridge, `hello { cwd, agent, conversationId, approval,
suggest, origin: 'ide', client }`, relay frames. No `vscode` import (hooks are injected), so it runs under jest.

## Methods

- `new LumaSession({ connectLib, getRoot, getSettings, resolveExecutable, clientName, ideName, hooks, resumeId, isTrusted })`.
- Connection: `connect({ startIfNeeded, resume, agentName })` (a newer call wins; Restricted Mode and "no folder"
  are explained errors), `disconnect()`, `awaitReady(timeoutMs)`, `send(type, payload)`, `hello(agent, resume)`.
- Session: `newSession(agentName)`, `switchAgent(name)`, `setApproval(mode)` (re-hello), `prompt(text, items)`,
  `followup`, `approve`, `abort`, `requestAgents`, `openInApp`, `generateCommitMessage(diff, files, hint)`.
- Chips: `addContext(item)`, `removeContext(id)`, `clearContext()`.
- Frames: `onSocketMessage(text)`, `onFrame(type, payload)`; `stateJson()` (the page's `state`); `dispose()`.
- Events: `state`, `frame (type, payload)`, `reset`. Public fields: `status`, `statusMessage`, `conversationId`,
  `agent`, `model`, `root`, `approval`, `streaming`, `resumedMessages`, `agents`, `context`, `hooks`, `getRoot`,
  `getSettings`.

## Recovery rules

A `ready` with `resumeMissed` clears the panel and notifies. A `bridge-error` `no-conversation`/`not-code` while a
resume is pending retries once without it (older hosts); `no-agent` before READY falls back to the plain Code
agent. Both retries are consumed (not emitted) and clear the pending hello values, so they cannot loop.
