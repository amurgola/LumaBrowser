# ActionSentence

`extensions/desktop-integration/features/agent-run/ActionSentence.js`

One line for what desktop control is doing, from a
[DesktopActivity](../../../../core/desktop/service/DesktopActivity.md) event.
Pure.

- `static of(event)`: `{ action, hwnd, title, args }` -> the approval card's
  own sentence ([DesktopCallText](../../../../core/llm-server/chat/approval/DesktopCallText.md))
  for `click`, `type`, `pressKey`, `scroll`, `launch` and `focus`, with the
  window named by its title (`in "notes.txt - Notepad"`) instead of its handle;
  the whole desktop (hwnd 0) stays `on the desktop`. `drag` and `setValue`,
  which the card never describes, get `Drag in "<title>"` and
  `Set element <ref> to "<value>" in "<title>"`.
- `TOOLS`: action name to `desktop_*` tool name.
