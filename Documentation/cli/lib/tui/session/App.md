# App

`cli/lib/tui/session/App.js`

The interactive `luma` session: owns the [Terminal](../Terminal.md), the [Screen](../Screen.md), the
transcript (live `blocks` and `committed` ones), the [Editor](../editor/Editor.md) and the approval
prompt. The bridge is injected as a `link` (`send`, `onFrame`, `onClose?`, `close`; see
[BridgeLink](../../BridgeLink.md)), so the session runs in tests and replays without a socket.

## Methods

- `new App({ link, opts, terminal?, theme?, now? })`: `opts` is
  `{ cwd, agent, agentIsGuess, resume, yes, showReasoning, suggest?, prompt }`; `terminal`, `theme`
  and `now` are seams (tests, `scripts/build-site-dev-replays.js`).
- `run()`: starts the terminal, asks the background colour (unless `LUMA_CLI_THEME` is set) in parallel
  with `hello`, switches to a light theme if the reply says so, writes the header, sends the first
  prompt if any, and resolves the exit code when the session ends (0, 1 error, 2 stopped; 1 when no
  `ready` ever came).
- `hello({ agent, conversationId, approval })`: sends `hello { cwd, agent, conversationId, approval, suggest }`;
  when the agent was a guess from the first word and the host says `no-agent`, the word joins the
  prompt and the Code agent is asked. Resolves `ready` or `null` (after an error block).
- `onFrame(type, payload)`: waiters first ([FrameWaiters](../../FrameWaiters.md)), then
  [TurnFrames](TurnFrames.md), then a render. `onKey(k)`: [SessionKeys](SessionKeys.md).
- Turns: `submit(text)` (a `/` line is a command; mid-turn text becomes a `followup`), `beginTurn`,
  `endTurn(commitAll)`, `abort()` (`stopping` status), `quit()`, `finish()` (commits what is live,
  restores the terminal, closes the link), `onLinkClosed()`, `onResize()` (debounced 80 ms, then a
  full repaint).
- Approvals: `askApproval(p)`, `decide(decision)` (sends `approve`).
- `command(line)`, `complete(prefix)`, `fetchAgents()`: [SessionCommands](SessionCommands.md).
- `toggleReasoning()`, `thinkingPreview` (getter), `header(ready, note?)`, `push(block)`,
  `requestRender()` (coalesced every 16 ms), `render()` ([SessionView](SessionView.md)), `spinner()`,
  `send`, `wait`.
- State read by the collaborators and tests: `streaming`, `stopping`, `blocks`, `committed`, `approval`,
  `exitCode`, `screen`, `editor`, `theme`, `turnStatus` ([TurnStatus](TurnStatus.md)), `answer`,
  `reasoning`, `rollback`, `showReasoning`, `approvalMode`, `agentName`, `model`, `conversationId`,
  `lastUsage`, `contextWindow`, `followupsQueued`, `quitArmed`, `agents`.
