# ApprovalAttention

`core/llm-server/chat/approval/ApprovalAttention.js`

Gets the user's attention when an agent run waits on an approval card and
LumaBrowser is not the focused window. Owned by
[AgentChatBridge](../AgentChatBridge.md), raised by
[ApprovalCheck](../bridge/tools/ApprovalCheck.md).

## Methods

- `new ApprovalAttention({ getWindow, notify, title?, tail? })`: `getWindow()` returns the main
  BrowserWindow or null (a throw reads as null); `notify({ title, body, onClick })`
  defaults to an Electron `Notification` (nothing where Electron or notifications
  are unavailable); `title` (default `TITLE`) and `tail` (default `TAIL`, "It is
  waiting in the chat.") are the notification's wording: the bridge's takeover
  instance says "LumaBrowser needs you".
- `request(detail, info?)`: with an unfocused, live window, `flashFrame(true)`,
  then the presenters (`request({ detail, ...info })`; `info` is
  `{ tool, params, window, grants, sensitive? }` from [ApprovalCheck](../bridge/tools/ApprovalCheck.md),
  or `{ kind: 'takeover', tool }` from [TakeoverHandler](../bridge/tools/handlers/TakeoverHandler.md)),
  and, when none showed the question, a
  notification titled `TITLE` ("LumaBrowser needs your approval") whose body is
  the card's detail (whitespace collapsed, cut at `MAX_BODY` 180) plus "It is
  waiting in the chat."; clicking it restores, shows and focuses the window. A
  focused or missing window gets nothing.
- `clear()`: the presenters' `clear()`, then stops the flash started by `request`.
- `addPresenter(presenter)` -> remove(): `{ request(question) -> true when
  shown, clear() }`, somewhere else to show the question while the window is
  not focused (the desktop-integration [ApprovalPresenter](../../../../extensions/desktop-integration/features/agent-run/ApprovalPresenter.md),
  which answers through the router). A throwing presenter is skipped.

## Why

An approval nobody sees denies itself after its 2-minute wait, so a build left
running in the background used to stall on a question the user never saw.
