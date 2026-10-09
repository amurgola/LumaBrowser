# TriggerToolSpecs

`core/llm-server/chat/trigger-mode/TriggerToolSpecs.js`

The names, descriptions and input schemas of the trigger setup tools.

## Methods (all static)

Each returns `{ name, mutating: true, description, inputSchema }`:

- `create()`: `create_trigger`, required `title` and `prompt`; optional
  `mode`, `agent_id`, `kind`, notification `host` / `tab_partition`, webhook
  `respond` / `preset` / `auth_header`, page `monitor_id`, `expect`,
  `artifact_root_id`, gating (`filter`, `cooldown_seconds`, `batch_seconds`,
  `batch_max`, `quiet_hours`), failure policy (`auto_pause_after`,
  `notify_failures`, `retry_max`, `retry_backoff_seconds`), `approval`,
  `approved_tools`, `memory`, `memory_runs`, `bot_guard`, file `dir`, `glob`,
  `file_events`, `recursive`, `allow_write`.
- `setSample()`: `set_sample` with `sample` (any type).
- `test()`: `test_trigger`, no parameters.
- `update()`: `update_trigger`, every create field except `kind`, `host`,
  `tab_partition` and `monitor_id`, plus `clear_memory`, `enabled` and `run_test`.
- `rollback()`: `rollback_trigger`, required `version`.

## Why

All are mutating so the approval card gates them: a trigger is a standing
permission for outside events to start agent runs.
