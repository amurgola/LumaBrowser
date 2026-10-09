# PlanExplainer

`core/llm-server/ui/js/setup-ui/plan/PlanExplainer.js`

The "How your model is running" card: the launch planner's decision notes for the current or last start, the interpreted failure, a live server-log tail and Start / Stop. Hidden until a plan exists.

## Methods

- `refresh()`: reads `getServerStatus()`; no notes hides the card. The notes and log drawers keep their open state; the log opens itself only on the transition into error. A Start refusal (which never moves the supervisor) is shown until the state leaves idle.
- `bindEvents()`: `onServerEvent` `state-change` refreshes, `log` appends.
- `appendLog({ line, stream })`: appends in place, trims to `LOG_MAX_LINES` (400) lines, scrolls to the end.

## Globals

Reads `document` (`#cardPlanExplainer`, `#planExplainerPill`, `#planExplainerBody`).
