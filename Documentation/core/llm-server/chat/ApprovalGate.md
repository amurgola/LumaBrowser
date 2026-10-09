# ApprovalGate

`core/llm-server/chat/ApprovalGate.js`

Decides which agent tool calls need a human yes before they run, and shapes the
model-facing result when one is refused. The rest of the gate lives in
[approval/](approval/): [ApprovalPolicy](approval/ApprovalPolicy.md) (is the
gate on for this run), [CommandCallAssessor](approval/CommandCallAssessor.md)
(how dangerous is this shell command), [CallDescriber](approval/CallDescriber.md)
(the card sentence) and [CardText](approval/CardText.md) (one-line clipping).

## Methods (all static)

- `requiresApproval(toolName, declared?, assessment?)`: true when the tool is in
  `MUTATING_TOOLS` or in `declared`. A `CommandCallAssessor` assessment with
  verdict `skip` (a readonly command) returns false; every other verdict leaves
  the name-based answer alone. Never throws on missing or odd arguments.
- `mutatingNamesOf(toolDefs)`: the `Set` of names whose definition carries
  `mutating: true` (exactly `true`), from the run's merged tool list.
- `deniedResult(toolName, reason)`: `{ success: false, error }` telling the
  model the call was not approved, not to retry, and to say what was left undone.
- `deniedCommandResult(toolName, assessment)`: `deniedResult` with the
  classifier's first reason (fallback: "the command was classified as unsafe to
  run on this machine.") plus up to three outside write targets.
- `MUTATING_TOOLS`: `write_file`, `edit_file`, `run_command`,
  `write_extension_file`, `install_extension`, `discard_build`, `send_webhook`,
  `send_notification_ntfy`, `timed_tasks_create`, `timed_tasks_delete`,
  `timed_tasks_trigger`, `create_scheduled_task`, `update_scheduled_task`,
  `run_scheduled_task`, `schedule_artifact_updates`.

## How a call is gated

1. `ApprovalPolicy.resolveRun` decides at run start whether the gate is on.
2. For a command tool, `CommandCallAssessor.assess` runs first (when
   `CommandCallAssessor.isEnabled(db)`): `deny` returns `deniedCommandResult`
   without asking; `ask-always` asks even when the run said "allow for this
   run" or the policy is never-ask in an interactive chat.
3. `requiresApproval` decides whether to show the card, and
   `CallDescriber.describe` writes its sentence.
4. A rejection or timeout returns `deniedResult`.

## Why

The agent runs unattended: write_file overwrites, install_extension puts code
the app will load on disk, send_webhook leaves the machine. The design is
deliberately small: no rule language and no persisted grants, because a
remembered rule silently authorises a different project months later. A
decision covers one call or, with "allow for this run", one run.

An unknown tool is NOT gated, the opposite of the concurrency classifier's
default: a gate that interrupts harmless calls gets turned off. The flag
`mutating: true` on a definition is the way forward; the list is the fallback
for core pseudo-tools without a definition and older extensions. A refusal is
a recoverable result, never an exception.
