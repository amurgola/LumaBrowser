# ConversationPlan

`core/llm-server/chat/plan/ConversationPlan.js`

One conversation's plan, kept in its meta under `data.plan`:
`{ steps: [{ text, status }], explanation, updatedAt }`. In the meta it outlives the
turn that wrote it, a compaction of the history and a restart, and the chat page reads
it with the meta call it already has (`conv.meta.get`).

## Methods

- `new ConversationPlan(store, conversationId, now?)`: `store` is the ChatStore
  (`getMeta`, `setMeta`); `now` is a test seam.
- `read()`: the plan, or null when there is none, the stored value is not a plan, or
  the meta cannot be read. Steps are re-narrowed through
  [PlanSteps](PlanSteps.md)`.normalize`, so a row from another build cannot produce a
  wrong plan.
- `save(steps, explanation?)`: replaces the plan and keeps the other meta data
  (`setMeta` replaces the whole data object, so this reads it first). No steps clears
  the plan. `explanation` is trimmed and cut at 300 characters. Returns what is stored.
- `clear()`: writes nothing when there was no plan.
- `retireFinished()`: clears a plan whose every step is completed and returns true;
  [PlanTool](PlanTool.md) calls it when the next turn starts.
