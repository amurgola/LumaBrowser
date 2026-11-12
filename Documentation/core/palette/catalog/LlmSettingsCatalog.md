# LlmSettingsCatalog

`core/palette/catalog/LlmSettingsCatalog.js`

The searchable list of the LLM tab's settings, for the Shift Shift universal search
palette: the Setup pages (LLM, Image, Music, Advanced and its sub-tabs), their
cards and rows, and the per-model fields of the chat's Tune dialog. A frozen array
of plain-data entries in the same format as `ShellSettingsCatalog`; extension-owned
Setup tabs are not listed (the palette derives those from manifests).

## Entry format

Same fields as `ShellSettingsCatalog` (`id`, `label`, `description`, `keywords`,
`path`, `kind`, optional `key`, `target`). `key` is the settings key from
`LlmDefaults.KEYS`, `ImageServerSettings.KEYS`, `GroupRouterSettings` and friends,
only where it is certain. Two target shapes:

- Setup: `{ surface: 'setup', page, subtab?, selector }`. `page` is a `#pageNav`
  view (`settings`, `image`, `music`, `advanced`). `subtab` is only used under
  Advanced and names an `#advSubtabs` pane (`placement`, `server`, `data`).
  Segmented pickers are addressed by their visible group
  (`[data-seg-for="defaultKvSelect"]`), not the hidden input; folds by
  `details[data-fold-key=...]`, which the reveal code opens.
- Tune: `{ surface: 'tune', field }`, a `ModelTunePanel` field id
  (`REQUEST_FIELDS`, `LAUNCH_FIELDS`, or `launchFlags` for the Extra flags row),
  the same id `SettingLink` accepts as `{ tune: field }`.

## Adding an entry

1. Add the control in its builder (for Chat defaults, `DefaultsCardHtml` through
   `DefaultsRows`).
2. Add an entry here with the control id as the selector and the right page.
4. An element only an instance method renders goes in the test's `RUNTIME`
   allowlist with the reason.

## Why

The Setup cards are rendered by JavaScript and many rows hide in "More settings"
folds, so a user hunting for "context length" or "make the chat remember more"
has nothing to scan. The catalog gives each one plain words and synonyms, and the
drift test renders the real builders so a renamed id breaks the build instead of
a search result.

Tune entries for Top P, Top K, Min P, Repeat penalty and Presence penalty.
