# TerminalPage

`core/terminal/TerminalPage.js`

The terminal page at `luma://terminal/`: its address, the test that tells a terminal tab from any other tab, and the
folders it is served from. A terminal tab is a regular tab (kind `user`) on this address, so it lives in the tab strip,
moves between windows and is restored like any tab.

- **Address.** `?session=` names a live session to show; `?profile=` and `?cwd=` say what to start when there is none.
  The page keeps profile and folder current in its own address, so the address alone reopens the terminal.
- **Files.** `ui/terminal` is the page; `/vendor/xterm/` and `/vendor/addon-fit/` map to the xterm.js packages in
  `node_modules`. [LumaPages](../browser/LumaPages.md) registers the routes with the other `luma:` pages.
- `isTerminal(url)` is what the rest of the app asks: the key handling ([Accelerators](../browser/Accelerators.md)),
  the page tools' refusal ([TabManager](../browser/TabManager.md)) and the IPC sender check.

## Methods

- Statics: `isTerminal(url)`, `url({ profileId, cwd, sessionId })`, `parse(url)`, `routes()` (for
  `protocol.registerSource`), `serve(url, fetchFile)` (the handler fallback; a path leaving its folder is a 404).
