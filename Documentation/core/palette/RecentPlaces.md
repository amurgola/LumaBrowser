# RecentPlaces

`core/palette/RecentPlaces.js`

The places the user was in most recently, newest first, for the search palette's
empty state: conversations, artifacts, Settings tabs, LLM Setup pages and single
settings. One row per place in the `palette_recent` table of settings.db, keyed by
`(kind, ref)`: visiting a place again moves it to the top instead of adding a row.
Only the newest `MAX_ROWS` (100) survive each write.

## Methods

- `new RecentPlaces(settingsDb, { now? })`: creates the table and its
  `visited_at` index if missing.
- `record({ kind, ref, title, subtitle?, data? })`: upserts the place; false for a
  malformed place (unknown kind, empty ref). Text fields are cut to 200
  characters and `data` over 4000 characters of JSON is dropped, since renderers
  send these.
- `list(limit = 20)`: `[{ kind, ref, title, subtitle, data, visitedAt }]`.
- `forget(kind, ref)`.
- `KINDS`: `conversation`, `artifact`, `settings`, `setup`, `setting`.

## Who records

[PaletteOpener](PaletteOpener.md) for everything opened from the palette;
[ShellPalette](../../ui/shell/palette/ShellPalette.md) for Settings tabs; the LLM
tab for conversations ([ConversationView](../llm-server/ui/js/chat/conversation/ConversationView.md)),
artifacts ([ArtifactPanel](../llm-server/ui/js/chat/panel/ArtifactPanel.md)) and
Setup pages ([SetupNavigator](../llm-server/ui/js/setup-ui/nav/SetupNavigator.md)),
all through `core.palette.record`.

## Why

Places are stored as references, not snapshots: [PaletteSearch](PaletteSearch.md)
resolves each against the live stores when listing, so a deleted conversation or
artifact simply drops out of Recent.
