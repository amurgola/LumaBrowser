# ApprovalPolicy

`core/llm-server/chat/approval/ApprovalPolicy.js`

Resolves whether the [approval gate](../ApprovalGate.md) is on for one agent
run: `'ask'` or `'never'`.

## Methods (all static)

- `resolve({ setting, interactive })`: `'ask'` and `'never'` settings win;
  anything else (including unset or unrecognised) is `auto`, which gives `'ask'`
  when `interactive` and `'never'` otherwise.
- `resolveRun({ override, setting, interactive })`: an `override` of exactly
  `'ask'` or `'never'` wins; anything else defers to `resolve`.
- `SETTING`: the settings DB key `core.llmServer.chat.approvalPolicy`, read at
  the start of every run so a change applies to the next run without a restart.

## Why

`auto` gates exactly where somebody can answer. A question nobody can see (a
scheduled task, an MCP caller, the sharing proxy) would hang the run until the
approval timeout and then deny it. `interactive` is the same signal that decides
whether ask_user_takeover is offered. The LLM tab's "Ask before mutating tools"
switch writes `auto` for on and `never` for off; `ask` is a deployment override
for headless runs and is not offered in the UI.

A per-run override exists because a terminal session is interactive in a way
the router cannot see, and a scripted `--yes` run is the opposite; both are
facts about one run, not deployment settings.
