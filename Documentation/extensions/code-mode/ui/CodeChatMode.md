# CodeChatMode

`extensions/code-mode/ui/CodeChatMode.js`

Code mode's client side on the LLM chat page: links `code.css` and registers
the `code` mode's hooks with the chat-extension registry; the
[build panel](CodeBuildPanel.md) follows the build events and the
conversation meta.

## Methods

- `register(registry)`: links `/llm-ui/ext/code-mode/code.css` once
  (`<link id="cm-code-styles">`; the loader serves declared assets but does not
  link them, and without it the panel rendered unstyled), then
  `registry.registerMode(hooks())`.
- `hooks()`: `{ id: 'code', startConversation, onOpenConversation, applyTheme,
  onLeaveConversation, onChatEvent, renderTurnExtras }`, arrow functions
  because the chat shell calls them on the registry's merged object.
  - `startConversation(api, ctx, data)`: sends the
    [kickoff turn](CodeKickoff.md) through `ctx.sendTurn` (errors ignored).
  - `onOpenConversation(meta)`: the build becomes `meta.data.build` (or none), then renders.
  - `applyTheme(rootEl, meta)`: renders, keeping the last build when the meta has none.
  - `onLeaveConversation()`: drops the batch lanes (per-turn state) and clears
    the panel; the build is kept so a repaint of the same build works.
  - `onChatEvent(evt)`: `batch:state` sets the lanes (`payload.lanes`, else
    none); `build:state` and `project:state` set the build; others are ignored.
  - `renderTurnExtras()`: no-op, reserved.

## Globals

Reads `window.LumaChatExt` (passed in by the entry) and `document`.
