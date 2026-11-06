# PaletteSearch

`core/palette/PaletteSearch.js`

The search palette's query engine. Runs every provider and returns the groups
ordered by their best hit, so whatever matches best is the first row whatever its
kind. An empty query returns the recent places instead.

## Methods

- `new PaletteSearch({ providers, recent, getChatStore, getArtifactStore })`:
  `providers` is `{ settings, actions, tabs, conversations, artifacts }`.
- `search(query, { windowId })`: `{ query, groups: [{ id, label, items }] }`. The
  query is trimmed and cut to 300 characters. Groups and their row limits:
  Settings 6, Commands 4, Open tabs 4, Conversations 6, Artifacts 4; ties keep that
  order. A provider that throws contributes nothing.
- `recentGroups()`: `[{ id: 'recent', label: 'Recent', items }]` or `[]`.
- `recentItems()`: up to `RECENT_LIMIT` (5) rows from
  [RecentPlaces](RecentPlaces.md), each resolved against the live data: a
  conversation that is gone or hidden, an artifact with no versions left, or a
  setting no longer in the catalog is skipped.

## Rows

Every provider returns the same shape: `{ kind, id, title, subtitle, marks, score }`
plus optional `subtitleMarks`, `tag` (Archived, Current), `hint` (a shortcut),
`detail` (a setting's description), `settingKind` and `data`. Kinds: `setting`,
`settings` (a Settings tab), `setup` (an LLM Setup page), `conversation`,
`artifact`, `tab`, `action`.

Providers: [SettingsProvider](providers/SettingsProvider.md),
[ActionProvider](providers/ActionProvider.md), [TabProvider](providers/TabProvider.md),
[ConversationProvider](providers/ConversationProvider.md),
[ArtifactProvider](providers/ArtifactProvider.md).
