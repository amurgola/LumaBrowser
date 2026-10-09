# ColorScheme

`cli/lib/tui/theme/ColorScheme.js`

Light or dark terminal background.

## Methods (static)

- `ColorScheme.fromColorFgBg(value)`: from a `COLORFGBG` hint such as `15;0` (the last number is the
  background: 7 and 15 are light, the grey ramp from 244 is light, cube colours by luminance); `null`
  when absent.
- `ColorScheme.fromOsc11(reply)`: from an OSC 11 reply (`rgb:rrrr/gggg/bbbb` with 1 to 4 hex digits, or
  `#rrggbb` / `#rrrrggggbbbb`); `null` when unreadable.
- `ColorScheme.luminance({ r, g, b })`: 0..1; above 0.5 is light.
