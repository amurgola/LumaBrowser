# SgrState

`cli/lib/tui/ansi/SgrState.js`

Tracks which SGR attributes, colours and OSC 8 hyperlink are open at a point in a string.

## Methods

- `process(code)`: applies one escape (SGR with 16, 256 and truecolor forms, resets, OSC 8 links;
  `0` resets everything but the link).
- `consume(text)`: applies every escape in `text`.
- `open()`: the codes that reopen the state on a fresh line. `close()`: the codes that close it.
- `reset()`, `isEmpty()`.
