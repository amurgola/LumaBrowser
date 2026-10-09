# CodeEditor

`core/llm-server/ui/js/code/CodeEditor.js`

The Code surface of the LLM tab: a real editor over the open conversation's
folder (the folder the agent edits, for Code mode and Game mode): lazy file
tree, tabbed Monaco editors, save, create, rename, delete. The conversation
stays docked beside it, and like the IDE plugins it turns a selection or file
into a context chip, follows the agent's writes (with a diff against the text
before the write) and inserts a reply's code block at the caret. Files come
only through `api.chat.workspace.*` (root-jailed IPC).

## Methods

- `new CodeEditor({ chatMode? })`; `setChatMode(chatMode)`.
- `mount(rootEl, api)`: builds the DOM once (`#codeRoot`).
- `show(conversationId)`: a new conversation resets and loads its folder
  (`workspace.info`, then the root listing and the editor); the same one
  refreshes from disk (the agent has likely written meanwhile).
- `hide()`, `hasUnsaved()`.
- `wantsChatDock()`: the Chat button's choice ([ChatDock](ChatDock.md)).
- `isDocked()`: showing, with `body.code-split` (set by the mode toggle).
- `openPath(path, line?)`: a file a tool card or reply names; outside the
  folder says so.
- `insertAtCaret(text)`.

Keyboard: Ctrl+S saves (Ctrl+Shift+S saves all) anywhere in the surface;
Ctrl+Alt+L asks about the selection; Ctrl+Alt+Shift+L adds it to the chat.

## Collaborators

- `chatMode.addContext(item, focus)` (legacy `window.LumaChatMode.addContext`,
  ported by A1): stages `{ kind: 'file' | 'selection', path, text, startLine?,
  endLine? }` on the next prompt; `focus` is true for "Ask". A hidden dock is
  shown first.
- Window events: listens to `luma-chat-tool` (detail `{ conversationId, phase:
  'approval' | 'run' | 'done', tool, params, success }`, dispatched by the chat
  shell) and dispatches `luma-code-dock` (the mode toggle re-applies the layout).
- [CodeWorkspace](CodeWorkspace.md), [EditorPane](EditorPane.md),
  [FileSaver](FileSaver.md), [DiskSync](DiskSync.md),
  [FileEntryActions](FileEntryActions.md), [AgentWriteFollower](AgentWriteFollower.md),
  [EditorContext](EditorContext.md), [CodeEditorLayout](CodeEditorLayout.md).

## Globals

Reads `window.monaco` (through MonacoLoader), `localStorage` (dock keys),
`window.LumaModal` / native dialogs (through Dialogs). Writes none (legacy
`window.LumaCodeEditor` is gone: the LLM tab entry passes the instance to the
mode toggle and the chat shell).
