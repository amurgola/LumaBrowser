# SystemPromptText

`core/llm-server/agent/SystemPromptText.js`

The model-facing wording of the agent's base system prompt. Data only.

## Members

- Roles: `ROLE_BROWSER`, `ROLE_NO_BROWSER`.
- Key constraints: `KEY_CONSTRAINTS_LEAD`, `KEY_CONSTRAINTS_LEAD_NO_TAIL`,
  `ONE_CALL_STRICT`, `ONE_CALL_PARALLEL`, `FINISH_WITH_MESSAGE`.
- Formatting: `formatLead(parallel)`, `FORMAT_EXAMPLE`, `FORMAT_STRICT_COUNT`,
  `FORMAT_PARALLEL_COUNT`, `FORMAT_FINISH`.
- Execution rules: `EXEC_ONE_CALL_STRICT`, `EXEC_ONE_CALL_PARALLEL`,
  `EXEC_DECIDE`, `EXEC_FINISH`, `EXEC_ON_FAILURE`, `EXEC_IMAGES`, `EXEC_BY_REF`,
  `EXEC_URL_CHANGE`.
- `currentDate(now)`: "Today is <Weekday>, <yyyy-mm-dd>. ..." (local quants
  default to their training-cutoff year otherwise).
- `activeTab(tabInfo)`.
