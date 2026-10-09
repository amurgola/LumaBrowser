# GuardedInput

`core/desktop/service/GuardedInput.js`

The only way desktop control sends real input.

## Methods

- `new GuardedInput({ win, guards })`.
- `send(w, inputs)` runs `guards.checkForeground(w)`, then `win.sendInputs(inputs)`.
  A SendInput failure becomes `HUMAN_NEEDED` when the secure desktop is now up
  (that is how it shows up mid-action); any other failure is rethrown.
- `release(inputs)` sends without the foreground check and swallows failures:
  a button or key must never be left held.
- `buttonFlags(button)` `{ down, up }` MOUSEEVENTF flags for `left` (default), `right`, `middle`.
