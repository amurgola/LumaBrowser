# EditorKeymap

`cli/lib/tui/editor/EditorKeymap.js`

What each key does to the [Editor](Editor.md).

## Methods (static)

- `EditorKeymap.handle(editor, key)` returns `{ consumed, submit?, changed?, nav? }`:
  - printable chars and paste insert; alt+b / alt+f jump words, alt+d kills the next word, other alt
    chars are not consumed;
  - enter submits (or accepts the open palette); alt/shift/ctrl+enter and ctrl+j insert a newline;
  - tab takes the suggestion when the box is empty, else completes (shift+tab backwards);
  - backspace removes a whole surrogate pair; alt/ctrl+backspace and ctrl+w kill the word before;
    delete;
  - left / right (ctrl or alt for words; right takes the suggestion in an empty box), home / end,
    ctrl+a / e / b / f, ctrl+u / k (kill to line start / end);
  - up / down move through the palette, then lines, then history at the edges (`nav: true`); ctrl+p / n
    are up / down;
  - escape closes the palette (not consumed otherwise).
