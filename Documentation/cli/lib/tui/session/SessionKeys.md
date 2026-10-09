# SessionKeys

`cli/lib/tui/session/SessionKeys.js`

The session's own keys, ahead of the editor.

## Methods

- `new SessionKeys(app)`.
- `handle(k)`:
  - with an approval open: left / shift+tab / `h` and right / tab / `l` move between Allow once, Allow
    for this run and Deny; enter confirms; `y` / `a` / `n` answer directly; esc and ctrl+c deny;
  - ctrl+c stops a running turn, else clears the input, else arms quit (a second ctrl+c within
    `QUIT_WINDOW_MS`, 2 s, quits);
  - ctrl+d quits when the input is empty; ctrl+l clears the screen; ctrl+o folds or unfolds thinking;
  - esc closes the palette, else stops a running turn;
  - everything else goes to the editor; a submit goes to `app.submit`.
