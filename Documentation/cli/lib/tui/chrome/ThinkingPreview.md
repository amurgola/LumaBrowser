# ThinkingPreview

`cli/lib/tui/chrome/ThinkingPreview.js`

A small window onto the model's thinking while it streams folded.

## Methods (static)

- `ThinkingPreview.render({ text, rows = 3, hint? }, width, theme)`: a box in the editor's shape
  (`╭─ thinking ─╮` ... `╰──╯`, ASCII corners with an ASCII theme) holding the last `rows` wrapped
  lines; short text pads from the top so the box never changes height; an optional hint sits in the
  bottom edge. Always `rows + 2` lines of exactly `width` cells.

## Why

It scrolls in place instead of growing, and it lives in the live region (never frozen into
scrollback), which is why it is chrome rather than a block.
