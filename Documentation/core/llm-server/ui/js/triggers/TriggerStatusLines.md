# TriggerStatusLines

`core/llm-server/ui/js/triggers/TriggerStatusLines.js`

The card's status lines: pause reason or failure streak, payload drift with
"Use latest as sample", restore of the last tested version, pending approval
(Allow, Allow for this run, Always allow, Deny), retry, quiet-hours hold,
batch, agent, gating, last refused delivery, expectations, sample, last test,
note.

## Methods

- `build(trigger, state, now?)`, `gating(trigger)`, `lastRefused(deliveries, now?)`; `REFUSED` labels.

## Unattended runs

`gating` names the approval mode either way: `asks before state-changing
tools` for `ask`, else `UNATTENDED` ("runs state-changing tools unattended
(desktop control too, when allowed)"), so an `auto` trigger's default is said
where its other gating is listed instead of being invisible.
