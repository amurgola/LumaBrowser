# ApprovalCheck

`core/llm-server/chat/bridge/tools/ApprovalCheck.js`

The approval gate at dispatch, the last check before a tool runs.

## Methods

- `new ApprovalCheck({ db, policy, toolSet, interactive, hooks, wait, timeoutMs, granted, onGranted, onUsed, attention })`:
  `policy` from `ApprovalPolicy.resolveRun`, `toolSet` a
  [RunToolSet](RunToolSet.md), `wait` an [ApprovalWait](../waits/ApprovalWait.md).
  `granted` (grant keys) seeds the run's "for this run" grants, carried over from
  earlier runs of the same conversation (a delegated sub-conversation, or a
  chat's carried family grants from [ConversationGrants](../../approval/ConversationGrants.md));
  `onGranted(key)` is told each new `run` grant (a throw is ignored);
  `onUsed(key)` is told when a carried grant lets a call through, so the
  conversation grant stays alive while used (a throw is ignored);
  `attention` (`{ request(detail), clear() }`, an [ApprovalAttention](../../approval/ApprovalAttention.md))
  is raised while a question waits and cleared after.
- `check(name, params)` resolves null (run it) or a denied result:
  1. `CommandCallAssessor.assess(name, params, { projectRoot (the mode tool's
     root), enabled: CommandCallAssessor.isEnabled(db) })`; `deny` returns
     `ApprovalGate.deniedCommandResult` without asking.
  2. A question is needed when the policy is `ask` (or the verdict is
     `ask-always` and someone can answer), `ApprovalGate.requiresApproval(name,
     toolSet.mutatingDeclared, assessment)` and the tool is not sandboxed.
  3. A tool granted "for this run" skips it unless `ask-always`. Grants are
     stored and checked under `ApprovalGate.grantKeyOf(name)`, so one grant for
     a family (every desktop input tool) covers all of its tools. A carried
     family's skip is reported to `onUsed`.
  4. Emits `approval` `{ tool, params, detail, grants?, grantScope? }` (`CallDescriber.describe`;
     `grants` is the family label, e.g. `desktop control`, for the card's button;
     `grantScope: 'chat'` for a carried family when `onUsed` is wired),
     raises `attention`, waits, clears it, emits `approval-done` `{ tool,
     decision }`; `run` grants the rest of the run (and reports it to
     `onGranted`), `reject` and `timeout` return `ApprovalGate.deniedResult`.

## Why

Last, after the ledger and required args, so nobody is asked about a call that
would not run. Silence denies. Grants die with the run, except a carried
family's, which the conversation keeps.
