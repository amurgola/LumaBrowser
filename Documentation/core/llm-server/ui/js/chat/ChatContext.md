# ChatContext

`core/llm-server/ui/js/chat/ChatContext.js`

The shared wiring of one chat surface: the injected `api`, the `root` element,
the chat-scoped Resonant (`resonant`), the [ChatState](ChatState.md) (`state`),
the mounted elements (`els`: sidebar, main, panel, content, stage, composerBar,
scroll, title, jump, artifactsBtn, sideModes, searchBox, recents, chatsList,
artsList) and every component by name (set by [ChatMode](ChatMode.md)).

## Methods

- `new ChatContext(collaborators)`; `ChatContext.COLLABORATORS` lists the
  accepted names (`chatExt`, `voiceFactory`, `codeEditor`, `setupNav`).
- `setCollaborators(partial)` replaces the named ones (a falsy value clears one).
- `chatExt()`, `codeEditor()`: the collaborator or `null`.
- `codeEditorDocked()`: the code editor exists and reports `isDocked()`.
- `modeDef(modeId)`: `chatExt.getMerged(modeId)` or `null`.
- `switchToSetup()`: dispatches window `luma-switch-mode` with `'setup'`.
