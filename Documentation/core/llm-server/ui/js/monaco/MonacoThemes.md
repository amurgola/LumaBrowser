# MonacoThemes

`core/llm-server/ui/js/monaco/MonacoThemes.js`

The LumaBrowser editor theme.

## Methods

- `MonacoThemes.define(monaco)` defines `luma-dark` (`base: 'vs-dark'`,
  `inherit: true`) once per page; later calls do nothing. Token colours
  (`RULES`) follow the chat palette; editor chrome (`COLORS`) matches the panel
  background `#0b1220`, with an accent cursor and the app's accent scrollbar
  thumb (15%, 30% on hover).
- `MonacoThemes.THEME_ID`, `RULES`, `COLORS`; `reset()` for tests.

## Globals

None.
