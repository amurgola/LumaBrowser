# ApprovalCheck

`core/llm-server/chat/bridge/tools/ApprovalCheck.js`

The approval gate at dispatch, the last check before a tool runs.

## Methods

- `new ApprovalCheck({ db, policy, toolSet, interactive, hooks, wait, timeoutMs, granted, onGranted, onUsed, attention, risk })`:
  `policy` from `ApprovalPolicy.resolveRun`, `toolSet` a
  [RunToolSet](RunToolSet.md), `wait` an [ApprovalWait](../waits/ApprovalWait.md).
  `granted` (grant keys) seeds the run's "for this run" grants, carried over from
  earlier runs of the same conversation (a delegated sub-conversation, or a
  chat's carried family grants from [ConversationGrants](../../approval/ConversationGrants.md));
  `onGranted(key)` is told each new `run` grant (a throw is ignored);
  `onUsed(key)` is told when a carried grant lets a call through, so the
  conversation grant stays alive while used (a throw is ignored);
  `attention` (`{ request(detail, info), clear() }`, an [ApprovalAttention](../../approval/ApprovalAttention.md))
  is raised while a question waits (`info`: `{ tool, params, window, grants }`,
  `window` true when a window-scoped grant is possible) and cleared after;
  `risk(name, params)` -> `{ reason }` or null names a sensitive call (a
  [DesktopCallRisk](../../approval/DesktopCallRisk.md) assessor), read only for
  gated tools.
- `check(name, params)` resolves null (run it) or a denied result:
  1. `CommandCallAssessor.assess(name, params, { projectRoot (the mode tool's
     root), enabled: CommandCallAssessor.isEnabled(db) })`; `deny` returns
     `ApprovalGate.deniedCommandResult` without asking.
  2. A question is needed when the policy is `ask` (or the verdict is
     `ask-always` and someone can answer), `ApprovalGate.requiresApproval(name,
     toolSet.mutatingDeclared, assessment)` and the tool is not sandboxed.
  3. A sensitive call (`risk`) asks every time: no grant covers it, a `run`
     answer grants nothing, no window grant is offered, and the detail ends
     with the reason (`... (a password field)`; the `approval` event and the
     attention carry `sensitive`). When nobody can answer (`interactive`
     false) it is refused outright with `ApprovalGate.deniedResult`.
  4. A tool granted "for this run" skips it unless `ask-always`. Grants are
     stored and checked under `ApprovalGate.grantKeyOf(name)`, so one grant for
     a family (every desktop input tool) covers all of its tools, and under
     `ApprovalGate.scopedKeyOf(name, params)`, so "only this window" covers the
     family in that window. A carried family's skip is reported to `onUsed`.
  5. Emits `approval` `{ tool, params, detail, grants?, grantScope?, sensitive? }` (`CallDescriber.describe`;
     `grants` is the family label, e.g. `desktop control`, for the card's button;
     `grantScope: 'chat'` for a carried family when `onUsed` is wired),
     raises `attention`, waits, clears it, emits `approval-done` `{ tool,
     decision }`; `run` grants the rest of the run (and reports it to
     `onGranted`), `window` grants the scoped key the same way (a plain once
     when the call names no window), `reject` and `timeout` return
     `ApprovalGate.deniedResult`.

## Why

Last, after the ledger and required args, so nobody is asked about a call that
would not run. Silence denies. Grants die with the run, except a carried
family's, which the conversation keeps.
