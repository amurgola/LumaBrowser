# LazySchemaStubber

`core/llm-server/chat/tool-schemas/LazySchemaStubber.js`

Lazy tool groups on the native-tool path: which schemas stay out of the
registered array.

## Methods (all static)

- `dropInactive(fullSchemas, groups, registeredGroups)`: `fullSchemas` without
  the tools owned only by groups outside `registeredGroups` (a Set or an
  array). A tool several groups own (`edit_artifact` sits in `artifacts` and
  `live_artifacts`) stays while any of them is registered. With no groups, or
  nothing to leave out, the input array is returned as is.

## Why

A tool that is left out is still reachable: the system prompt's registry
names its group, `activate_tools` loads the manual and `call_tool` runs it
([NativeToolPlan](../bridge/tools/NativeToolPlan.md),
[CallToolCall](../bridge/tools/CallToolCall.md)).

Until 2026-11-20 this class also turned inactive tools into parameterless
stubs (`apply`, `stubSchema`), which kept them nameable for the auto-activate
bounce. A stub had to become the real schema once its group was loaded, and
that change to the array made the server read the whole prompt again, so the
stubs were removed. The earlier rule also left out a tool as soon as one of
its groups was inactive, even with another one active.
