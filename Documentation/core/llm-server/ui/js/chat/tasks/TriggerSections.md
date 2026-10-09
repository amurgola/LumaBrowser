# TriggerSections

`core/llm-server/ui/js/chat/tasks/TriggerSections.js`

The lower sections of a trigger's runs view: Memory (Clear memory), Instruction
versions when there is more than one (Restore, re-arming a tested version
without a new test), Runs (Replay this event; the newest run expanded) and the
delivery log with outcome counts, which answers "why didn't it fire?" with each
refusal's reason and links to its run.

## Methods

- `appendAll(view, { t, runs, deliveries, deliveryCounts, versions })`.
