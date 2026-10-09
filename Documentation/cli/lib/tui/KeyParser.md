# KeyParser

`cli/lib/tui/KeyParser.js`

Turns raw stdin bytes into key events `{ name, ch, ctrl, alt, shift }`.

## Methods (static)

- `KeyParser.parse(chunk, state)` returns `{ keys, rest }`. `state` (`{ pasting, pasteBuf }`) is
  mutated so a bracketed paste can span chunks; `rest` is an unfinished escape sequence for the next
  chunk.
- `KeyParser.key(name, extra)`: a key event.

Names: `char` (in `ch`), `enter`, `tab`, `backspace`, `delete`, `escape`, arrows, `home`, `end`,
`pageup`, `pagedown`, `insert`, `f1`..`f12`, `paste` (text in `ch`, CRLF normalised), `ctrl` with the
letter in `ch`, `osc` (a terminal reply, raw in `ch`), `focus`, `unknown`. Understands CSI with xterm
modifiers, SS3, kitty `CSI u`, modifyOtherKeys `CSI 27;mod;code ~`, alt as an ESC prefix, and
`\n` as ctrl+j.
