# ComposerView

`core/llm-server/ui/js/chat/composer/ComposerView.js`

The composer: the textarea (grows to 220 px; Enter sends, Shift+Enter is a new
line, ignored while streaming; "/" and "@" open
[ComposerCommands](ComposerCommands.md), which takes Enter, Tab, arrows and
Escape while its menu is open; Up in an empty box edits the last prompt through
[ChatShortcuts](../common/ChatShortcuts.md); a paste with files goes to
[ClipboardAttach](ClipboardAttach.md)), the Send button that is Stop while
streaming (titled "Stop (Esc)"),
the gear, the open-tab picker ([TabContext](TabContext.md); hidden without a
browser), thinking pill and mic on the left (28px ghost icon buttons,
`cm-tool-btn`), the token meter on the right, the no-model notice (one plain
line with a secondary Open Setup button) and the attachment strip above, and the
AI disclaimer under the reply composer.

## Methods

- `ComposerView.html(big)`: `big` is the landing's centred composer ("Ask
  anything, or type / for commands", no disclaimer); otherwise "Reply".
- `wire(scope)`: textarea, Send/Stop (Stop only aborts the stream on screen),
  thinking pill, gear, mic (hidden without a voice surface), Open Setup
  (switches to Setup and asks `setupNav.go('settings')`), usage, attachments,
  availability.
- `setSendStop(streaming)`, `refreshSendState()`: disabled with nothing to send
  or no model; while streaming, disabled except in the conversation that is
  streaming (one stream at a time). An enabled Send (not Stop) gets
  `cm-send-ready`, the only state with the accent fill.
- `focus()`, `text()` (what is typed in the composer on screen, the one
  `focus()` lands in; the region editor's Edit now sends it), `clearReplyBox()`.
- `openSetup(page = 'settings')`: switches to Setup and asks
  `setupNav.go(page)`; the no-model notice and an
  [ErrorCard](../turns/ErrorCard.md)'s [SettingLink](../turns/SettingLink.md)
  use it.
- `ComposerView.NO_MODEL`, `SEND_TITLE`.
