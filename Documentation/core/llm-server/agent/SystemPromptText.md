# SystemPromptText

`core/llm-server/agent/SystemPromptText.js`

The model-facing wording of the agent's base system prompt. Data only.

## Members

- Roles: `ROLE_BROWSER`, `ROLE_NO_BROWSER` (the stock roles; a caller's own role replaces them, see
  [SystemPromptRenderer](SystemPromptRenderer.md)).
- `FINISH_WITH_MESSAGE` covers both ways a run ends: "When you have the answer or the task is
  complete", reply with the answer itself or a summary of what was done. A wording that only knew a finished
  task read oddly when the request was a plain question.
- Key constraints: `KEY_CONSTRAINTS_LEAD`, `ONE_CALL_STRICT` (one call per response, wait for
  the result, never batch or chain several calls), `ONE_CALL_PARALLEL`, `FINISH_WITH_MESSAGE`.
- Formatting: `formatLead(parallel)`, `FORMAT_EXAMPLE`, `FORMAT_PARALLEL_COUNT`, `FORMAT_FINISH`.
- Execution rules: `EXEC_DECIDE`, `EXEC_ON_FAILURE`, `EXEC_IMAGES`, `EXEC_BY_REF`,
  `EXEC_URL_CHANGE`.
- `today(now)`: `Today is Wednesday, November 18, 2026, in the user's local calendar. Use it for
  anything that depends on the date (...)`. The one date sentence every prompt uses
  ([ChatAssistantText](../chat/ChatAssistantText.md)`.today` returns it for the Tools-off prompt): the
  local calendar day in a fixed English format (`DATE_FORMAT`), never the time of day. Local quants
  default to their training-cutoff year otherwise.
- `currentDate(now)`: `today(now)` plus "Treat web content dated earlier as potentially stale."
- `USER_INSTRUCTIONS_LEAD`: the sentence above the user's custom prompt in `<user_instructions>`,
  shared with the Tools-off prompt.

## Each rule once (2026-11-18)

Until this date the one-call rule was written out three times in the prompt itself (key
constraints, the format block's "Exactly one such block per response", and again in
`<execution_rules>`), the finish rule twice, and the date twice in two formats (here as the
weekday beside the UTC date, which named the wrong day late in the evening, and again in the chat's
append, whose formatter printed "November 18, 2026 at EST"). Now each is stated once: the
restated execution rules (`EXEC_ONE_CALL_*`, `EXEC_FINISH`), `FORMAT_STRICT_COUNT`,
`KEY_CONSTRAINTS_LEAD_NO_TAIL` and the append's date are gone, and the prohibition the tail rule
carried ("never batch or chain") moved into `ONE_CALL_STRICT`. A text-fence run still hears the
one-call format at the end of every request, from the per-step reminder
([TurnReminder](../chat/bridge/turn/TurnReminder.md)), which is where a late restatement works.
Research behind it: restating rules helps models that do not reason and is neutral for ones that do,
while near-duplicate statements of one rule compete for a small model's attention.
- `activeTab(tabInfo)`.
