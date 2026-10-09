# PopoverCloser

`core/llm-server/ui/js/chat/common/PopoverCloser.js`

The one outside-click closer for the chat's menus and model popover. Arming
replaces any stale listener, so a menu that closes itself on a timer can never
leave a listener that tears down the next menu on its opening click.

## Methods

- `arm()`: on the next tick, the next document click closes everything.
- `closeAll()`: disarms, removes `.cm-model-pop` and `.cm-menu` inside the root
  and `.cm-menu` on the document.
- `showMenuAt(menu, event, reserve)`: appends to `<body>` at the click point,
  clamped `reserve` px from the right and bottom edges, then arms.
