# XtermLoader

`ui/shell/terminal/XtermLoader.js`

Loads xterm.js and its fit addon into the window chrome with a dynamic import the first time the terminal dock opens,
so a window that never shows a terminal never pays for it.

## Methods

- Static `load()` -> `{ Terminal, FitAddon }`.
