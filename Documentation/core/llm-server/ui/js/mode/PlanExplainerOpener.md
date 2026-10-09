# PlanExplainerOpener

`core/llm-server/ui/js/mode/PlanExplainerOpener.js`

Opens the Setup page's launch-plan explainer (`#cardPlanExplainer
.plan-notes-details`) and scrolls to it, polling every 250 ms for up to 8 s
because Setup paints it after the server reports a plan.

## Methods

- `open(doc?)`.
