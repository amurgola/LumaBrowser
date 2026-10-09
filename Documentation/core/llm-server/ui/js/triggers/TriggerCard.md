# TriggerCard

`core/llm-server/ui/js/triggers/TriggerCard.js`

The live card above a trigger conversation's composer. It mirrors whether the
app is listening (awaiting a sample, needs a test, tested, armed, auto-paused,
running), re-reads the trigger on every trigger event, and keeps its state
across the composer re-renders of the open conversation.

## Methods

- `new TriggerCard({ chatMode? })`; `setChatMode(chatMode)`.
- `decorate(els, ctx)`: needs `ctx.api.triggers`; mounts into the composer's
  wrap right above `.cm-composer` (or `els.bar`), sets the textarea placeholder
  "Describe what the trigger should do…", subscribes once to
  `api.onTriggersEvent`, refreshes.
- `leave()`: unmounts and clears the per-conversation state (base URLs, watch,
  composer text and form choices outlive it, as in legacy).
- `refresh()`, `paint()`, `unmount()`, `setNote(text, cls)` (clears after 6 s).
- Fields: `state` (the card state the markup builders read), `element`.

Events: `run-started` for this trigger shows Running at once; other triggers'
events are ignored once a trigger is known; with none known every event
re-checks (`create_trigger` may have just made one).

## Collaborators

- `chatMode.openTrigger(id)` (legacy `window.LumaChatMode.openTrigger`, A1): View runs.
- [TriggerCardData](TriggerCardData.md), [TriggerCardHtml](TriggerCardHtml.md), [TriggerCardActions](TriggerCardActions.md).
