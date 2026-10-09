# AuxiliaryServices

`app/services/AuxiliaryServices.js`

Builds the loopback OpenAI-compatible API ([LocalApiServer](../../core/llm-server/server/LocalApiServer.md),
off by default, never starts a model) and the unified model placement
([PlacementService](../../core/placement/PlacementService.md)).

## Methods

- `new AuxiliaryServices(ctx)`; `build()` adds `localApiServer` (published
  `__lumaLocalApiServer`) and `placementService` over the LLM, image, music and
  grounding servers with lazy agent dependencies (published
  `__lumaPlacementService`). Their ready-time starts are in
  [SettledStarts](../ready/SettledStarts.md).
