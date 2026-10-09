# PlanExplainerHtml

`core/llm-server/ui/js/setup-ui/plan/PlanExplainerHtml.js`

The markup of the launch-plan card: headline, promoted decision, failure block, notes, log drawer and the Start or Stop button.

## Methods

- `html(status, { notesOpen, logOpen, startError })`, `pill(state)` (`PILLS`), `headline(plan)`, `decision(notes)`, `errorBlock(status, startError)`, `logHtml(logs)`, `actionRow(state)`; everything interpolated is escaped.

## Globals

None.
