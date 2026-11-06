# PaletteService

`core/palette/PaletteService.js`

The universal search palette ("Shift Shift"); the feature overview is
[SearchPalette](SearchPalette.md). Owns one [PaletteView](PaletteView.md) per
browser window, the query engine ([PaletteSearch](PaletteSearch.md)), the
[PaletteOpener](PaletteOpener.md), [RecentPlaces](RecentPlaces.md), the
[ConversationIndex](ConversationIndex.md) and [DigDeeper](DigDeeper.md). Built by
[CoreIpcRegistrar](../../app/ipc/CoreIpcRegistrar.md), published as
`global.__lumaPalette`.

## Methods

- `new PaletteService({ settingsDb, electron, getTabViewManager, getLlm, getChatStore, getArtifactStore, listExtensions, docs, getRouter })`:
  builds the providers (settings over both catalogs plus extension entries,
  commands, conversations, artifacts, the window's tabs) and applies the
  double-Shift setting to [DoubleShift](DoubleShift.md).
- `start()`: warms the conversation index 20 s after boot (unref'd timer).
- `isDoubleShiftEnabled()`, `setDoubleShiftEnabled(enabled)`: the
  `core.palette.doubleShift` setting (default on), applied at once.
- `toggle(win)`, `close(win, { restoreFocus })` (also aborts a running dig),
  `raiseAll()`.
- `query(win, text)`: searches with that window's tabs.
- `open(win, item)`: hides the palette first so whatever the row opens gets focus,
  then runs the opener; a throw becomes `{ success: false, error }`.
- `continueInChat(query)`: sets a compose chat intent (prompt, documentation pill
  on, not sent; see [ComposeIntent](../llm-server/ui/js/chat/modes/ComposeIntent.md))
  and opens the chat.
- `record(place)`, `windowForSender(sender)`, `viewForSender(sender)`,
  `windowIdOf(win)`.
- `DOUBLE_SHIFT_KEY` (`core.palette.doubleShift`), `WARM_INDEX_MS`.
