# ThemePalettes

`cli/lib/tui/theme/ThemePalettes.js`

LumaBrowser's terminal palette and glyph sets.

## Statics

- `PALETTES.dark`, `PALETTES.light`: hex colours per slot (`accent`, `accentDeep`, `text`, `dim`,
  `muted`, `good`, `warn`, `bad`, `info`, `border`, `codeBg`, `panelBg`, `selectedBg`, `diffAdd`,
  `diffDel`, `diffCtx`), mirroring the desktop chat's CSS tokens.
- `BASIC`: the 16-colour SGR code per slot.
- `GLYPHS.unicode`, `GLYPHS.ascii`: bar, prompt, spinner frames, status glyphs, rules, arrows.

## Why

The spinner is the CLI's own mark breathing (outline, half, filled, half). Every frame has the same
footprint, which matters in a cell twice as tall as it is wide; rotating shapes lurch instead.
