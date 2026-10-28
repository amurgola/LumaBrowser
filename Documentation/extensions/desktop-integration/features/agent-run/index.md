# agent-run feature

`extensions/desktop-integration/features/agent-run/index.js`

The user's hand on a desktop run, from any app. While the chat agent clicks,
types or scrolls in another window through desktop control, LumaBrowser's own
window is behind that app: this feature puts the run on the desktop activity
overlay and its controls on the Ctrl+Alt+Shift keys. On by default. Wiring
lives in [AgentRunFeature](AgentRunFeature.md).

## What the user sees

- **The run**: the ring frames the window being acted on and the island says
  what is being done ("Type "invoices" in File Explorer", step 4) with Pause
  and Stop ([RunPresence](RunPresence.md), fed by
  [DesktopActivity](../../../../core/desktop/service/DesktopActivity.md)).
  Paused, it says so, names the action waiting ("Waiting to: ...") and offers
  Continue. Stopped, it says so and retracts. It stays up a few seconds after
  the last action (the model is looking and thinking), then retracts.
- **Approvals**: when an agent waits for an approval and LumaBrowser is not the
  focused window, the question shows on the island instead of only a
  notification: Allow, Allow desktop control for this chat, Only this window,
  Deny, with the call's sentence under them, framed on the window the call
  would act on ([ApprovalPresenter](ApprovalPresenter.md), registered with the
  chat router's [ApprovalAttention](../../../../core/llm-server/chat/approval/ApprovalAttention.md)).
  "Only this window" is a window-scoped grant
  ([ApprovalGate](../../../../core/llm-server/chat/ApprovalGate.md)`.scopedKeyOf`),
  carried for the conversation like the family grant.
- **Takeovers**: when the agent asks the user to clear a login, CAPTCHA or
  second-factor prompt (`ask_user_takeover`, which `observe_page` now suggests
  on such pages, see [PageBlockDetector](../../../../core/browser/tab-manager/PageBlockDetector.md))
  and LumaBrowser is not focused, the island says what to do with Done, Skip
  this step and Stop ([TakeoverPresenter](TakeoverPresenter.md)).
- **Sensitive calls**: typing into a password field or acting in a checkout or
  banking window asks every time, with the reason, even under a carried grant
  ([DesktopCallRisk](../../../../core/llm-server/chat/approval/DesktopCallRisk.md)).
- **The step counter**: the island's detail line says where the agent is in
  its step budget and how long it has run ("Step 7 of 24, 42 s, in Notepad"),
  from the router's [RunProgress](../../../../core/llm-server/chat/bridge/turn/RunProgress.md),
  refreshed every second while up.
- **The hint**: holding Ctrl+Alt+Shift lists **Space Pause** (or Continue) and
  **Esc Stop** while a run is live, **Y Allow** and **N Deny** while a question
  waits, **Y Done**, **N Skip** and **Esc Stop** while a takeover waits, and
  nothing from this feature otherwise.

## Actions

| id | Default shortcut | What |
| --- | --- | --- |
| `pause` | `Ctrl+Alt+Shift+Space` | Holds the agent before its next desktop action ([DesktopRunControl](../../../../core/desktop/service/DesktopRunControl.md)`.pause`); pressed again, continues. The model's tool call waits; nothing is typed meanwhile. |
| `stop` | `Ctrl+Alt+Shift+Escape` | Stops desktop control at once (the call in flight fails with code `STOPPED` at its next input batch, and actions are refused for 3 s) and ends the agent's turn (the chat router's `abort`). |
| `allow` | `Ctrl+Alt+Shift+Y` | Answers the waiting approval with Allow (once); tells a waiting takeover you are done. |
| `deny` | `Ctrl+Alt+Shift+N` | Answers the waiting approval with Deny; skips the step a waiting takeover asked for. |

Allow and Deny also answer an approval card waiting in the chat with nothing on
the island (LumaBrowser focused): the router's `respondApproval`.

## Routes

- `GET /api/desktop/agent-run/` -> `{ success, supported, desktopControl, run: { live, paused, step, window: { hwnd, title } | null, action, waiting, progress: { iteration, maxIterations, startedAt } | null }, stopped, approval: { detail, tool, window, grants, hwnd } | null, takeover: { detail } | null, actions: [{ id, label, description, binding, registered, conflict }] }`.
- `POST /api/desktop/agent-run/pause`, `/resume`, `/stop` -> `{ success, action, ... }`
  (`pause` on a paused run continues; `stop` adds `aborted`, `wasLive`).
  503 `NO_DESKTOP` without a desktop service.
- `POST /api/desktop/agent-run/approval { decision: 'once' | 'run' | 'window' | 'reject' }`
  -> `{ success, action, decision, takeover? }`; with a takeover waiting
  instead, `once` says the user is done and `reject` skips the step
  (`takeover: 'continue' | 'skip'`); 409 `NO_APPROVAL` when nothing waits,
  400 for another decision.

## Settings (`settingsSchema`)

| key | type | default |
| --- | --- | --- |
| `binding.pause`, `binding.stop`, `binding.allow`, `binding.deny` | hotkey | the shortcuts above; empty = no shortcut |
| `showRun` | bool | true (the run on the ring and island) |
| `showApprovals` | bool | true (approval questions on the island while LumaBrowser is not focused) |
| `ring` | bool | true (the edge light around the window being acted on) |

## Limits

- Desktop control is Windows only, so the run display is too; the approval
  island works everywhere the overlay does.
- A whole-desktop action (hwnd 0) hides the overlay afterwards so the agent's
  next whole-screen screenshot does not contain it; a window screenshot that
  falls back to on-screen pixels (exclusive fullscreen, protected video) can
  still include the island at the window's top.
- Lumabyte's actions go through desktop control too, so they show here as well
  as in its panel.

## Files

- [AgentRunFeature](AgentRunFeature.md): shortcuts, attachment, the hint's keys, REST, settings.
- [RunPresence](RunPresence.md): the run on the overlay.
- [ApprovalPresenter](ApprovalPresenter.md): the approval question on the island.
- [TakeoverPresenter](TakeoverPresenter.md): the takeover question on the island.
- [ActionSentence](ActionSentence.md): one line per action.
