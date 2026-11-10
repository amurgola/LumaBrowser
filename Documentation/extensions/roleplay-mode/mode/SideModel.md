# SideModel

`extensions/roleplay-mode/mode/SideModel.js`

Which model answers a story's bookkeeping calls: the stage manager
([StageCall](../stage/StageCall.md)), casting ([ProfileCall](../pipeline/ProfileCall.md)),
consolidation ([ConsolidateCall](../pipeline/ConsolidateCall.md)) and the
pressure line ([PressureCall](../pipeline/PressureCall.md)). The prose polish
and the art audit stay on the story model: one keeps the narrator's voice, the
other looks at images.

## Methods

- `SideModel.ref(data, router)` the ref for a side call. The setup's
  `sideModel` says: '' or unset for the story model (`llmModel`), `helper`
  for the app's resident helper model (used only while
  `router.helperModelRef()` answers, so a box without one runs exactly as
  before), or an explicit model ref. `router` defaults to the app's chat router
  (`HostGlobals.chatRouter()`).
- `SideModel.helperRef(router)` the helper's ready ref or null;
  `SideModel.split(data, router)` whether the bookkeeping goes elsewhere
  than the narrator right now.

## Why

Nothing here loads or unloads anything: the choice is a ref, and the router
routes it. A helper that is off, loading or absent costs nothing but the
fallback, which is the behaviour before the helper existed.
