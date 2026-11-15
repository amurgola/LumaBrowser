# TerminalService

`core/terminal/TerminalService.js`

The app's terminals in the main process. It opens a session from a profile, keeps what is known about each session,
passes a session's output to the one viewer drawing it (a terminal tab or the dock), and carries an agent's run, read
and send calls. The shells themselves live in the terminal host process ([TerminalHostClient](TerminalHostClient.md)).

- **Ids** are short and per launch: `t1`, `t2`, ...
- **Profiles.** A shell profile is started as itself. An app profile (a CLI such as Claude Code) is its command typed
  as the first command of the host shell, so the shell is still there when the app exits.
- **Session environment.** Every program in a terminal can read `LUMA_TERMINAL` (the session id), `LUMA_API_PORT` (the
  local API) and, for a terminal opened under a page, `LUMA_TAB_ID`. [ShellLaunch](shells/ShellLaunch.md) adds
  `TERM_PROGRAM=LumaBrowser`.
- **One viewer per session.** Attaching a second viewer tells the first it was detached. The screen so far is fetched
  before the viewer is set, so a viewer sees every byte once (see [PtySession](host/PtySession.md) `snapshot`).
- **The user's hand.** `setHeld(id, true)` (the tab's "Take over" button) makes `agentRun` and `agentSend` answer
  `{ error }`; `agentRead` keeps working. `agentActive` is set by an agent's first input, or at open for a session an
  agent opened, and is what makes the tab show its banner.
- **Host loss.** When the host process dies its sessions stay listed as exited until they are closed.

## Methods

- `new TerminalService({ host, profiles, launch, apiPort })`, getter `profiles`.
- `open({ profileId, cwd, size, besideTabId, startupCommand, origin })` -> session view; rejects for an unknown
  profile or a shell that cannot start.
- `list()`, `get(id)` -> `{ ...host info, origin, viewed, held, agentActive, besideTabId }` or null.
- `attach(id, viewer)` -> `{ session, snapshot }` or null; `detach(id, viewerKey)`.
- `write(id, data)`, `resize(id, { cols, rows })`, `ack(id, chars)`: one-way, for known sessions only.
- `close(id)`, `setHeld(id, held)`, `agentRun(id, params)`, `agentSend(id, params)`, `agentRead(id, params)`.
- `onHostEvent(event)`: `data`, `state`, `exit` for a session, or `host-exit`. `shutdown()`.
- Events: `opened`, `changed`, `closed`.

`tabBeside(id)` -> `{ id, title, url }`, the tab a docked session belongs to ([TerminalTabContext](TerminalTabContext.md)): a docked terminal stays the terminal of the tab it was opened under. Null for a terminal that is not under a page, or whose tab is gone. Constructor option `tabContext`.
