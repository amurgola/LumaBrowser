# ChatShortcuts

`core/llm-server/ui/js/chat/common/ChatShortcuts.js`

The chat's keyboard shortcuts beyond the composer's Enter and the sidebar's
Ctrl+K. Document-level keys act only while the chat root and its ancestors are
not hidden (Setup and Code keep their keystrokes).

| Key | Action |
| --- | --- |
| Escape | Stops the reply on screen. An open modal keeps its own Escape; an open menu or model popover is closed first. |
| Ctrl/Cmd+Shift+N | New chat (Ctrl+Shift+O is the browser's Bookmarks). |
| Up, in an empty composer | Opens the newest prompt in [UserTurnEditor](../turns/UserTurnEditor.md). |

## Methods

- `install()`: binds the document listener once.
- `onComposerKey(event, textarea)`: the composer's keydown hook; true when the
  key was consumed.
- `editLastPrompt()`: false when there is no persisted prompt on screen or a
  turn is streaming.

## Globals

None.
