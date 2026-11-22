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

The helper model rows of Chat defaults' More settings (`llm.helper-model`,
`llm.helper-model-file`, `llm.helper-context`) have entries too; the startup model
alert reveals `llm.helper-model-file` when the helper's model is gone.

`llm.vram-warning` ("Low VRAM warning", key `core.llm.vramWarning`, path LLM > Chat
defaults > More settings) targets the `#defaultVramWarning` toggle, next to
`llm.unload-on-vram-pressure`.

## Frameworks (2026-11-22)

The runtime select left Chat defaults: which build serves a model is decided per framework in the Frameworks card.
`llm.runtime` ("Frameworks", a section, path LLM > Frameworks) targets `#cardRuntimes`; its key stays
`core.llmServer.defaults.runtimeId`, now the record of the build that serves the default model, so its value is
that build's name. The framework options moved into the framework frames of that card: `llm.openvino-device`,
`llm.kv-cache`, `llm.parallel`, `llm.tensor-split`, `llm.moe-gpu-cache`, `llm.context-retention`,
`llm.peer-gpus` and `llm.ram-pin` (path LLM > Frameworks) target
`[data-card-group="settings"] [data-fw-option$=":<optionId>"]` (the `frameworkOption` helper; the first framework
frame that has the option) and carry `defaultsField: '<optionId>'`, the LlmDefaults field
[SettingValueReader](../SettingValueReader.md) reads from the effective defaults. They keep their global `key`
for the drift test and as the fallback. The frames are drawn from the live frameworks view, so the drift test
checks those selectors against a frame built to the DOM contract instead of the rendered builders.
