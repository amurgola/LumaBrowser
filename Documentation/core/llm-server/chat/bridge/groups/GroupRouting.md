# GroupRouting

`core/llm-server/chat/bridge/groups/GroupRouting.js`

Asks the opt-in tool-group router which lazy groups a message needs and
activates them.

## Methods

- `new GroupRouting(router)`: uses `router.llmServerService.groupRouter`.
- `route(prompt, activate)`: `groupRouter.classify(prompt)`; activates a
  non-empty answer and returns it. Null with no router, no prompt, a null
  answer or a throw. Never throws.

## Why

It only adds groups and answers null when off, slow or down, so a sick router
leaves the turn as it was.
