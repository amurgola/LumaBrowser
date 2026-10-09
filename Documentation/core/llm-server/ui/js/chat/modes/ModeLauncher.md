# ModeLauncher

`core/llm-server/ui/js/chat/modes/ModeLauncher.js`

Starts a conversation in an extension chat mode: preflight (the mode's own, else
[ModePreflight](ModePreflight.md)), setup (the mode's `openSetup(api, ctx)` with a
lazily created inline host, else its schema form through
`chatExt.openSchemaInline`, else none; a cancel restores the previous screen),
create the conversation and persist its meta up front, render and theme it, then
let the mode send its opening turn (marked as a first turn for the AI title).
Modes with `agent: true` start with tools on.

## Methods

- `start(modeId, presetData?)`: preset data (an external launcher) skips setup.
- `checkPendingIntent()`: takes a one-shot `api.chat.takeIntent()` only after the
  mode list loaded (it is read-once on the server).
- `leaveActive()`: clears editor chips and calls the outgoing mode's
  `onLeaveConversation` (before the mode is reassigned).
