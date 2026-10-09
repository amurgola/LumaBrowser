# ApprovalCheck

`core/llm-server/chat/bridge/tools/ApprovalCheck.js`

The approval gate at dispatch, the last check before a tool runs.

## Methods

- `new ApprovalCheck({ db, policy, toolSet, interactive, hooks, wait, timeoutMs })`:
  `policy` from `ApprovalPolicy.resolveRun`, `toolSet` a
  [RunToolSet](RunToolSet.md), `wait` an [ApprovalWait](../waits/ApprovalWait.md).
- `check(name, params)` resolves null (run it) or a denied result:
  1. `CommandCallAssessor.assess(name, params, { projectRoot (the mode tool's
     root), enabled: CommandCallAssessor.isEnabled(db) })`; `deny` returns
     `ApprovalGate.deniedCommandResult` without asking.
  2. A question is needed when the policy is `ask` (or the verdict is
     `ask-always` and someone can answer), `ApprovalGate.requiresApproval(name,
     toolSet.mutatingDeclared, assessment)` and the tool is not sandboxed.
  3. A tool granted "for this run" skips it unless `ask-always`.
  4. Emits `approval` `{ tool, params, detail }` (`CallDescriber.describe`),
     waits, emits `approval-done` `{ tool, decision }`; `run` grants the rest of
     the run, `reject` and `timeout` return `ApprovalGate.deniedResult`.

## Why

Last, after the ledger and required args, so nobody is asked about a call that
would not run. Silence denies. Grants die with the run.
