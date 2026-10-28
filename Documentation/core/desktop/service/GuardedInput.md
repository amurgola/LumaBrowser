# GuardedInput

`core/desktop/service/GuardedInput.js`

The only way desktop control sends real input.

## Methods

- `new GuardedInput({ win, guards, control? })`: `control` a
  [DesktopRunControl](DesktopRunControl.md) (without one nothing is ever stopped).
- `send(w, inputs)` runs `control.check()` (throws `STOPPED` once the user
  pressed Stop: the rest of the action is never sent), then
  `guards.checkForeground(w)` (when one of `w`'s own popups
  is in front it is recorded on `w.popupInFront`), then `win.sendInputs(inputs)`.
  A SendInput failure becomes `HUMAN_NEEDED` when the secure desktop is now up
  (that is how it shows up mid-action); any other failure is rethrown.
- `release(inputs)` sends without the foreground check and swallows failures:
  a button or key must never be left held.
- `buttonFlags(button)` `{ down, up }` MOUSEEVENTF flags for `left` (default), `right`, `middle`.
