# ComposerStrip

`core/llm-server/ui/js/chat/composer/ComposerStrip.js`

Base of the strips that sit above the composer:
[ConversationJobsStrip](../jobs/ConversationJobsStrip.md) (order 10),
[PlanPanel](../plan/PlanPanel.md) (order 20) and
[PendingMessages](../pending/PendingMessages.md) (order 30). It keeps one element in
the composer's wrap while the subclass has markup to show and removes it when it has
none.

## Methods

- `new ComposerStrip(ctx, className, order)`.
- `attach(bar)`: called on every conversation render; the composer bar is rebuilt each
  time, so the strip is put back with what it already knows.
- `paint()`: asks the subclass's `html()`; an empty string unmounts the strip.
- `unmount()`.
- `html()` and `onClick(event)`: for the subclass.
- `ComposerStrip.target(event, attribute)`: the element under a click that carries the
  attribute, or null.

## Order

Each strip is inserted before the first sibling strip with a higher order, else before
the composer, so the stack is always jobs, plan, queued messages, composer whichever of
them appeared first. The queue sits nearest the composer because it is what the reply
box feeds.
