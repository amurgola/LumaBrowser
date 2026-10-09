# TriggerStatusLines

`core/llm-server/ui/js/triggers/TriggerStatusLines.js`

The card's status lines: pause reason or failure streak, payload drift with
"Use latest as sample", restore of the last tested version, pending approval
(Allow, Allow for this run, Always allow, Deny), retry, quiet-hours hold,
batch, agent, gating, last refused delivery, expectations, sample, last test,
note.

## Methods

- `build(trigger, state, now?)`, `gating(trigger)`, `lastRefused(deliveries, now?)`; `REFUSED` labels.
