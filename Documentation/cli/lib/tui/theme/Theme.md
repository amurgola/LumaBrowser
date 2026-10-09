# Theme

`cli/lib/tui/theme/Theme.js`

The colours and glyphs one session paints with.

## Methods

- `new Theme({ depth = 24, scheme = 'dark', ascii = false })`. Fields: `depth`, `scheme`, `ascii`,
  `glyph`, `palette`, `c` (slot closures: `theme.c.accent(text)`).
- `Theme.create({ stream?, env?, scheme? })`: depth from [ColorDepth](ColorDepth.md); ASCII glyphs for
  `LUMA_CLI_ASCII=1` or `TERM=dumb`; scheme from the argument, `LUMA_CLI_THEME`, `COLORFGBG`, else dark.
- `fg(slot, text)`, `bg(slot, text)`: truecolor, the nearest 256 index, or the 16-colour code by depth;
  plain text at depth 1.
- `bold`, `dim`, `italic`, `underline`, `inverse`, `strike`, each closing only its own attribute.
- `link(url, text)`: an OSC 8 hyperlink (plain text without colour).
- `hint(key, label)`: `key` dim, label muted.
- `sgrFor(slot, bg)`, `color` (getter).
