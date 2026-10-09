# PanelEditor

`core/llm-server/ui/js/chat/panel/PanelEditor.js`

The artifact panel's one Monaco editor, created on first use and reused for the
tab's lifetime (Monaco costs about 5 MB parsed). One change handler serves every
artifact: on an HTML artifact a user edit debounces (250 ms) the source into the
preview iframe's `srcdoc`.

## Methods

- `ensure()`: resolves the editor or `null` (MonacoLoader failed).
- `write(text, language)`: sets the language (`MonacoLanguages.languageFor`) and
  value, following the last line; its own writes never trigger the preview.
- `setReadOnly(readOnly)`, `relayoutSoon()`, `revealTop()`.

## Globals

Reads `window.monaco` (through MonacoLoader).
