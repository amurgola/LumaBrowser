# ApprovalAttention

`core/llm-server/chat/approval/ApprovalAttention.js`

Gets the user's attention when an agent run waits on an approval card and
LumaBrowser is not the focused window. Owned by
[AgentChatBridge](../AgentChatBridge.md), raised by
[ApprovalCheck](../bridge/tools/ApprovalCheck.md).

## Methods

- `new ApprovalAttention({ getWindow, notify })`: `getWindow()` returns the main
  BrowserWindow or null (a throw reads as null); `notify({ title, body, onClick })`
  defaults to an Electron `Notification` (nothing where Electron or notifications
  are unavailable).
- `request(detail)`: with an unfocused, live window, `flashFrame(true)` and a
  notification titled `TITLE` ("LumaBrowser needs your approval") whose body is
  the card's detail (whitespace collapsed, cut at `MAX_BODY` 180) plus "It is
  waiting in the chat."; clicking it restores, shows and focuses the window. A
  focused or missing window gets nothing.
- `clear()`: stops the flash started by `request`.

## Why

An approval nobody sees denies itself after its 2-minute wait, so a build left
running in the background used to stall on a question the user never saw.
