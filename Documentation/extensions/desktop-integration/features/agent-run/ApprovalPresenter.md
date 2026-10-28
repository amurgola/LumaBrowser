# ApprovalPresenter

`extensions/desktop-integration/features/agent-run/ApprovalPresenter.js`

An approval question on the activity island, for the moments LumaBrowser is
not the focused window (the chat card is then behind the app the user is in).
Registered with the chat router (`addApprovalPresenter`), so
[ApprovalAttention](../../../../core/llm-server/chat/approval/ApprovalAttention.md)
hands it every question it raises; an answer goes back through
`router.respondApproval`, which settles the same
[ApprovalWait](../../../../core/llm-server/chat/bridge/waits/ApprovalWait.md)
the chat card answers, so the card closes too. One question at a time.

## Methods

- `new ApprovalPresenter({ overlay, getRouter, options, keys, onChange, log? })`:
  `options()` -> `{ show, ring }`; `keys()` -> `{ allow, deny }`, the keycap
  letters of the allow and deny shortcuts ('' when unbound).
- `request(question)` (the presenter contract): `question`
  `{ detail, tool, params, window, grants }`. Shows a `keys` island (hint
  `HINT`, caption the detail) framed on `windowOf(question)` and returns true;
  false (so the notification stays) without an overlay or with `showApprovals` off.
- `choices(question)`: `once` Allow (with the allow letter), `run`
  `Allow <grants> for this chat` when the call has a grant family, `window`
  `Only this window` when a window-scoped grant is possible, `reject` Deny
  (with the deny letter). Chips without a letter show their label alone.
- `answer(decision)`: `'once' | 'run' | 'window' | 'reject'` -> true when a
  question was waiting and the router took the answer; closes the island.
- `clear()` (the presenter contract): the question was answered elsewhere or
  timed out; closes the island.
- `pending`: `{ detail, tool, window, grants, hwnd }` or null. `dispose()`.
- `static windowOf(question)`: the hwnd a `desktop_*` call names (> 0), else 0.
