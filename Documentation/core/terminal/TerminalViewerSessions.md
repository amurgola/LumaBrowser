# TerminalViewerSessions

`core/terminal/TerminalViewerSessions.js`

Ties whatever shows a terminal to the session it shows.

- **A terminal tab's page** has exactly one session. A reloaded page keeps it. A tab opened for a live session
  (`?session=`: an agent's terminal, or one moved out of the dock) takes that session over, once. Any other tab starts
  the profile and folder its address names, falling back to the default profile when that profile no longer exists.
  This is what makes a restored terminal tab reopen in the folder it was in.
- **The dock** (the window chrome) names sessions by id and opens new ones beside the active tab.
- **Ownership.** A page or window that goes away takes its sessions with it.
- **Trust.** `sessionFor` gives a page its own session whatever id it sends; only the chrome may name one.

Output reaches a viewer on the `core.terminal.event` channel.

## Methods

- `new TerminalViewerSessions({ service, getTabViewManager })`.
- `attachPage(sender, size)`, `attachDock(sender, { id, profileId, cwd, size, besideTabId })` -> `{ session,
  snapshot }`.
- `sessionFor(sender, id, fromChrome)` -> session id or null.
- `restart(sender, id, size)`: same profile, same folder, same viewer.
- `openTab({ profileId, cwd, sessionId, windowId, activate })`, `closeTabOf(sender)`.
