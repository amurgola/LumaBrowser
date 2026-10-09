# SpeedSimulator

`core/llm-server/ui/js/setup/SpeedSimulator.js`

The wizards' live "speed tolerance" preview.

## Methods

- `SpeedSimulator.start(outEl, tokensPerSec, stepMs = 60)` types `LOREM` into
  `outEl` at about `tokensPerSec x 3.6` characters per second, wrapping at the
  end and keeping it scrolled to the bottom. Returns the interval id; the caller
  clears it.
- `SpeedSimulator.LOREM`, `CHARS_PER_TOKEN`.

## Globals

None.
