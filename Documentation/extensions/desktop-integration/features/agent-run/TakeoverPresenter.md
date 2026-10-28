# TakeoverPresenter

`extensions/desktop-integration/features/agent-run/TakeoverPresenter.js`

A takeover question on the activity island: the agent hit a login, CAPTCHA or
second-factor prompt only the user can clear (`ask_user_takeover`,
[TakeoverHandler](../../../../core/llm-server/chat/bridge/tools/handlers/TakeoverHandler.md))
and LumaBrowser is not the focused window. Registered with the chat router
(`addTakeoverPresenter`), so the takeover's
[ApprovalAttention](../../../../core/llm-server/chat/approval/ApprovalAttention.md)
hands it every question; an answer goes back through `router.respondTakeover`,
which settles the same [TakeoverWait](../../../../core/llm-server/chat/bridge/waits/TakeoverWait.md)
the chat card answers. One question at a time.

## Methods

- `new TakeoverPresenter({ overlay, getRouter, options, keys, onChange, log? })`:
  `options()` -> `{ show, ring }`; `keys()` -> `{ allow, deny, stop }`, the
  keycap letters of the shortcuts ('' when unbound).
- `request(question)` (the presenter contract): `question.detail` is the
  model's one sentence of what to do in the tab. Shows a `keys` island (hint
  `HINT`, "Luma needs you", caption the detail) on the monitor and returns true;
  false without an overlay or with `showApprovals` off.
- `choices()`: `continue` "Done, continue" (the allow letter), `skip` "Skip
  this step" (the deny letter), `stop` "Stop" (the stop letter).
- `answer(action)`: `'continue' | 'skip' | 'stop'` -> true when a question was
  waiting and the router took it; closes the island.
- `clear()` (the presenter contract), `pending` (`{ detail }` or null), `dispose()`.
