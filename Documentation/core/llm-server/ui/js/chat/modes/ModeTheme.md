# ModeTheme

`core/llm-server/ui/js/chat/modes/ModeTheme.js`

A mode's theme over the chat column: a background image (base64 or URL) through
the `--cm-bg-image` property and the `cm-has-bg` class.

## Methods

- `applyBackground(b64OrUrl, mime)`, `clear()`.
- `apply()`: the mode's `applyTheme(mainEl, meta, ctx)` hook, else the plain
  theme.
