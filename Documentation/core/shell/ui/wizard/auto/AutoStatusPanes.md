# AutoStatusPanes

`core/shell/ui/wizard/auto/AutoStatusPanes.js` (ES module)

Automatic Setup's outcome views.

## Methods

- `progress(pane)` (Cancel stops both downloads), `done(pane)` (with the image
  result), `error(pane)`: the error, a fix hint (or the system-library command
  with Copy and "Check again"), "Fix and retry" (resumes from a failed image or
  music leg), "Choose a smaller setup" (the guided local questions), "Chat
  without images" (drops the image and music legs and runs again).

## Globals

Reads `navigator.clipboard` (through Clipboard).
