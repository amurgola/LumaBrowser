# FoldGroups

`ui/shell/settings/general/FoldGroups.js`

Settings groups that fold to one line. A group is a `<details class="gs-fold" data-gs-fold="<key>">` whose summary holds the group title, a few words on its state (`[data-gs-fold-summary]`, for example "Installed in 7 IDEs" or "All 152 on") and an optional state-driven button (`[data-gs-fold-action]`, for example Install or Update). It is the Settings modal's take on the LLM Setup status line: set-once groups stay one line while they are fine, so the rows people change often are not pushed off the page.

Rules:

- A group the user opened or folded is remembered in localStorage under `gs.fold.<key>` (a UI-only preference). The value is written on the summary click, so opening a group from code never changes what is remembered.
- A group that needs attention (`summarize(key, text, { attention: true })`) opens on its own and takes the warning color on its summary words. It is never folded again from code: closing a group under the cursor would hide what the user is working on.
- A click on the summary button does not fold or unfold the group.

Keys in use: `jetbrains`, `vscode`, `windhawk` ([IdeInstallerList](IdeInstallerList.md)), `api-tools`, `agent-tools` ([EndpointToolsPanel](EndpointToolsPanel.md)), `share-tools` ([SharingWebTools](../sharing/SharingWebTools.md)), `share-clients` ([SharingTokensList](../sharing/SharingTokensList.md)). Styles: `.gs-fold*` and `.gs-row-fold` in settings-content.css. [SettingsReveal](../SettingsReveal.md) opens a fold around a setting the palette jumps to.

## Methods

- `new FoldGroups({ doc?, storage? })`, `install()`: restores and wires every `details[data-gs-fold]` in the page.
- `FoldGroups.summarize(key, text, { attention? }, doc?)` returns the group element or null.
- `FoldGroups.setAction(key, action | null, doc?)`: `action` is `{ label, disabled? }`; null hides the button.
- `FoldGroups.onAction(key, handler, doc?)`: wires the summary button.
- `FoldGroups.keyFor(key)`, `STORE_PREFIX`.

## Globals

Reads `localStorage`.
