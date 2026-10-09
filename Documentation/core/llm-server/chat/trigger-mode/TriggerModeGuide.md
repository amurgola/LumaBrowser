# TriggerModeGuide

`core/llm-server/chat/trigger-mode/TriggerModeGuide.js`

The fixed part of the trigger setup prompt. Used by
[TriggerModePrompt](TriggerModePrompt.md).

## Methods (static)

- `lines()` returns the guide as prompt lines, section by section: event
  sources (webhook, file, page), webhook presets and the bot loop guard, gating
  (filter, cooldown, batch, quiet hours), persistent memory, failure policy
  (retries, notifications, auto-pause), payload drift, instruction versions and
  rollback, approval (`auto` / `ask`), result checks (`expect`,
  `artifact_root_id`), notification triggers, file triggers, action and
  response modes (`agent` / `prompt`, `ack` / `result`), the arming flow, the
  setup-form exception, the live card, and how to write a self-contained run
  prompt.

## Why

The setup model has to know every setting it can choose and what the runner
enforces, so it can propose sensible defaults (a filter for chatty senders, a
cooldown or batch for bursts, `ask` approval for anything that sends or writes)
and explain the arming flow once. Secrets are never to be pasted into the chat:
the user sets them in the trigger's runs view.
