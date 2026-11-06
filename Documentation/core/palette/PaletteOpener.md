# PaletteOpener

`core/palette/PaletteOpener.js`

Carries out a chosen palette row and remembers the place in
[RecentPlaces](RecentPlaces.md). Shell-side work goes to the window's chrome as a
`tab-view:accelerator` message, the path page shortcuts already use, where
[ShellPalette](../../ui/shell/palette/ShellPalette.md) picks it up.

## Methods

- `new PaletteOpener({ settings, actions, recent, getLlm, getTabViewManager, getArtifactStore })`.
- `open(item, win)`: resolves `{ success, error? }`. By kind:
  - `setting`: looks the entry up by id. A `shell` or `extension` target sends
    `{ action: 'palette-reveal', target }` to the chrome; a `setup` or `tune`
    target calls `LLMServerService.revealSetting(target)`.
  - `settings` (a Settings tab from Recent): `palette-reveal` with just the tab.
  - `setup`: `LLMServerService.openSetup({ page })`.
  - `conversation`: `LLMServerService.openConversation(id)`.
  - `artifact`: in its conversation's side panel (`LLMServerService.openArtifact`)
    when it has one, else in a browser tab at the artifact store's URL, as the
    Artifacts list does.
  - `tab`: switches to it, and focuses its window when that is another one.
  - `action`: a `run.shell` command goes to the chrome as
    `{ action: 'palette-run', run }`; `open-chat` and `open-settings` run in main.
- Errors are plain sentences for the palette ("The chat is turned off.", "That
  tab is closed.").
