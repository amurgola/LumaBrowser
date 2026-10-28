# X11Keysyms

`extensions/desktop-integration/features/hotkeys/X11Keysyms.js`

The X keysym behind an Electron accelerator key name: letters (lowercase
keysym, so the layout decides the physical key), digits, `F1` to `F24`, and
the named keys HotkeyBindings writes (`Space`, `Tab`, `Return`, `Escape`,
`Delete`, `Insert`, `Home`, `End`, `PageUp`, `PageDown`, the arrows, `Plus`
and the punctuation). `keysym(name)` is null for anything else (media keys),
which the bridge refuses to watch.
