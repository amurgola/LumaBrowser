# DesktopKeys

`core/desktop/DesktopKeys.js`

Turns key combos ("ctrl+shift+s", "alt+tab", "enter", "f5") into Windows
virtual-key codes and SendInput event descriptors.

## Methods

- `DesktopKeys.parseCombo(combo)` virtual-key codes in the order written
  (case-insensitive, `+`-separated). Throws `keys is empty`, or
  `Unknown key "<name>". Use names like ctrl, shift, alt, win, enter, tab, esc, f5, a-z, 0-9, arrows.`
  (the agent sees this text).
- `DesktopKeys.comboEvents(combo)` `[{ vk, up, extended }]`: every key down in
  order, then every key up in reverse, so modifiers wrap the main key.
- `DesktopKeys.VK` name to code table: named keys and aliases (`esc`/`escape`,
  `win`/`meta`/`cmd`/`super`, arrows as `left`/`arrowleft`, ...), `f1`-`f24`,
  `a`-`z`, `0`-`9`, and US punctuation.
- `DesktopKeys.EXTENDED` codes that need the extended-key flag (navigation
  cluster, arrows, insert/delete, win, menu, numlock).
- `DesktopKeys.NAMED_KEYS` the hand-written part of `VK`.

## Why the extended flag

Apps that read scan codes (games) see arrow and navigation keys sent without
the flag as numpad keys.
