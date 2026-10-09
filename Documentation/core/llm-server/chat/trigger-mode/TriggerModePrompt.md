# TriggerModePrompt

`core/llm-server/chat/trigger-mode/TriggerModePrompt.js`

The system prompt of a trigger setup turn. Used by [TriggerMode](../TriggerMode.md).

## Methods (static)

- `build(trigger, toolGroups = null, bases = null, extras = {})` returns the
  prompt inside `<trigger_mode>` tags, in this order:
  1. [TriggerModeGuide](TriggerModeGuide.md)`.lines()`;
  2. `<run_tools>`: the run tools (`ScheduledTaskPrompt.toolListLines`), only
     when `toolGroups` is an array;
  3. a note that the model picker and gear panel control the runs;
  4. `<agents>` (`- id: name - description (N knowledge docs)`, or "none
     configured") when `extras.agents` is an array;
  5. `<persisted_tabs>` (`- partition: title (host)`, ", not restored yet" when
     not live, or a "none" hint) when `extras.tabs` is an array;
  6. `<page_monitors>` when `extras.monitors` has entries, a "no monitors yet"
     note when it is an empty list, nothing when absent;
  7. `<live_artifacts>` (`- rootId R: title`) when `extras.artifacts` has entries;
  8. for an existing trigger: the "ALREADY EXISTS ... Current state:" paragraph,
     the pretty JSON of [TriggerStateView](TriggerStateView.md), the recent
     deliveries (compact JSON) and the sample (one line, 1500 chars).
- Lists are capped at `LIST_CAP` (40); `SAMPLE_PREVIEW_CHARS` (1500).

## Why

An absent list means its source is off (no Agent Manager, no Page Watcher), so
the block is left out rather than claiming the user has none.
