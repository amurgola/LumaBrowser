# ColorDepth

`cli/lib/tui/theme/ColorDepth.js`

How many colours the terminal shows, and the 256-colour fallback.

## Methods (static)

- `ColorDepth.detect(stream, env?)`: 1 for `NO_COLOR`, `LUMA_CLI_COLOR=0` or `FORCE_COLOR=0`; 24 for
  `FORCE_COLOR=3` or `COLORTERM=truecolor|24bit`; 8 / 4 for `FORCE_COLOR=2` / `1`; else the stream's
  `getColorDepth(env)`; else 8 on a TTY, 1 otherwise.
- `ColorDepth.rgbTo256({ r, g, b })`: the nearest xterm-256 index, luma-weighted, the colour cube
  unless the colour is nearly neutral and the grey ramp is closer.
- `ColorDepth.hexToRgb(hex)`; `ColorDepth.CUBE`.
