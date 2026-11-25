# KeyCodes

`core/browser/tab-manager/KeyCodes.js`

The `KeyboardEvent.code` that goes with a key name, on a US layout.

## Methods

- `KeyCodes.codeOf(key)`:
  - a letter, either case -> `KeyL`; a digit -> `Digit7`;
  - punctuation and the space character -> the name of their key (`Space`, `Comma`, `Period`, `Slash`,
    `Semicolon`, `Quote`, `BracketLeft`, `BracketRight`, `Backslash`, `Minus`, `Equal`, `Backquote`);
  - `Shift`, `Control`, `Alt`, `Meta` -> their left key (`ShiftLeft`);
  - any other name (`Enter`, `ArrowDown`, `F5`, `Space`) -> itself;
  - any other single character (`!`, an accented letter) -> `''`, as the platform reports for a key it cannot place.

## Why

[KeyPresser](KeyPresser.md) used to send `'Key' + key` for everything it did not list, so "l" went out as
`Keyl` and "7" as `Key7`. A page that looks a key up by `event.code` (a canvas app, a remote screen, a game)
found nothing and ignored the press. Found 2026-11-24 with an Android screen mirrored into a canvas: typing
through press_key did nothing.
